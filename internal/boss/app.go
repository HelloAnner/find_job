package boss

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
	"unicode"

	"github.com/playwright-community/playwright-go"

	"get_jobs/internal/ai"
	"get_jobs/internal/bot"
	"get_jobs/internal/config"
	"get_jobs/internal/play"
	"get_jobs/internal/utils"
)

const (
	homeURL    = "https://www.zhipin.com"
	baseURL    = "https://www.zhipin.com/web/geek/job"
	dataPath   = "data/boss/data.json"
	cookiePath = "data/boss/cookie.json"
	statsPath  = "data/boss/stats.json"
)

// App is the Go port of the original Java Boss logic.
type App struct {
	cfg    *config.BossConfig
	aiCfg  config.AiConfig
	bot    *bot.Client
	ai     *ai.Client
	runner *play.Runner
	black  *Blacklists

	results    []Job
	startTime  time.Time
	dataFile   string
	cookieFile string
	statsFile  string
	stats      *DailyCounter
	maxChats   int
	aiReady    chan error
	aiOnce     sync.Once
	aiReadyErr error
}

type DailyCounter struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

func newDailyCounter() *DailyCounter {
	return &DailyCounter{Date: today(), Count: 0}
}

func (dc *DailyCounter) resetIfNeeded() {
	today := today()
	if dc.Date != today {
		dc.Date = today
		dc.Count = 0
	}
}

// NewApp wires all dependencies together.
func NewApp(cfg *config.Root, env config.Env) (*App, error) {
	aiClient := ai.New(env)
	if cfg.Boss.EnableAI && aiClient == nil {
		return nil, errors.New("启用了AI能力但未配置AI环境变量")
	}

	runner, err := play.NewRunner(!cfg.Boss.OpenWindowsEnabled())
	if err != nil {
		return nil, err
	}

	dataFile := config.ResolvePath(dataPath)
	cookieFile := config.ResolvePath(cookiePath)
	statsFile := config.ResolvePath(statsPath)

	if err := utils.EnsureFile(dataFile, []byte(`{"blackCompanies":[],"blackRecruiters":[],"blackJobs":[]}`)); err != nil {
		runner.Close()
		return nil, err
	}
	if err := utils.EnsureFile(cookieFile, []byte("[]")); err != nil {
		runner.Close()
		return nil, err
	}

	black, err := loadBlacklists(dataFile)
	if err != nil {
		runner.Close()
		return nil, err
	}

	stats, err := loadDailyCounter(statsFile)
	if err != nil {
		log.Printf("[boss] 读取投递计数失败: %v", err)
		stats = newDailyCounter()
	}

	app := &App{
		cfg:        &cfg.Boss,
		aiCfg:      cfg.AI,
		bot:        bot.New(cfg.Bot, env),
		ai:         aiClient,
		runner:     runner,
		black:      black,
		dataFile:   dataFile,
		cookieFile: cookieFile,
		statsFile:  statsFile,
		stats:      stats,
		maxChats:   cfg.Boss.MaxChat,
	}
	if cfg.Boss.EnableAI && aiClient != nil {
		app.aiReady = make(chan error, 1)
		go func() {
			app.aiReady <- validateAiClient(aiClient)
		}()
	}
	return app, nil
}

func (a *App) Close() {
	if a == nil {
		return
	}
	if a.runner != nil && !a.cfg.Debugger {
		a.runner.Close()
	}
}

// Run executes the Boss投递流程。
func (a *App) Run() error {
	a.startTime = time.Now()
	page := a.runner.Page()

	if err := a.login(page); err != nil {
		return err
	}

	for _, city := range a.cfg.CityCode {
		if err := a.postJobByCity(page, city); err != nil {
			log.Printf("[boss] 城市 %s 投递失败: %v", city, err)
		}
	}

	if len(a.results) == 0 {
		log.Println("[boss] 未发起新的聊天…")
	} else {
		log.Println("[boss] 新发起聊天公司如下:")
		for _, job := range a.results {
			log.Println(job.String())
		}
	}

	if !a.cfg.Debugger {
		a.printResult()
	}
	return nil
}

func (a *App) printResult() {
	duration := utils.FormatDuration(a.startTime, time.Now())
	msg := fmt.Sprintf("\nBoss投递完成，共发起%d个聊天，用时%s", len(a.results), duration)
	log.Println(msg)
	// 企业微信在单个岗位成功时已实时推送，此处仅记录日志
	if err := a.saveData(); err != nil {
		log.Printf("[boss] 保存黑名单失败: %v", err)
	}
	a.results = nil
	if !a.cfg.Debugger {
		a.runner.Close()
	}
	time.Sleep(1 * time.Second)
}

func (a *App) saveData() error {
	if err := a.updateListData(); err != nil {
		log.Printf("[boss] 更新黑名单失败: %v", err)
	}
	payload := struct {
		BlackCompanies  []string `json:"blackCompanies"`
		BlackRecruiters []string `json:"blackRecruiters"`
		BlackJobs       []string `json:"blackJobs"`
	}{
		BlackCompanies:  setToSlice(a.black.Companies),
		BlackRecruiters: setToSlice(a.black.Recruiters),
		BlackJobs:       setToSlice(a.black.Jobs),
	}

	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(a.dataFile, data, 0o644)
}

func setToSlice(set map[string]struct{}) []string {
	list := make([]string, 0, len(set))
	for k := range set {
		list = append(list, k)
	}
	sort.Strings(list)
	return list
}

func loadBlacklists(path string) (*Blacklists, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var payload struct {
		BlackCompanies  []string `json:"blackCompanies"`
		BlackRecruiters []string `json:"blackRecruiters"`
		BlackJobs       []string `json:"blackJobs"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		return nil, err
	}
	bl := newBlacklists()
	for _, v := range payload.BlackCompanies {
		addToSet(bl.Companies, v)
	}
	for _, v := range payload.BlackRecruiters {
		addToSet(bl.Recruiters, v)
	}
	for _, v := range payload.BlackJobs {
		addToSet(bl.Jobs, v)
	}
	return bl, nil
}

func (a *App) buildSearchURL(city string) string {
	qs := url.Values{}
	addParam := func(key, value string) {
		if value != "" && value != config.UnlimitedCode {
			qs.Set(key, value)
		}
	}
	addList := func(key string, values []string) {
		if len(values) == 0 {
			return
		}
		if len(values) == 1 && values[0] == config.UnlimitedCode {
			return
		}
		qs.Set(key, strings.Join(values, ","))
	}

	addParam("city", city)
	addParam("jobType", a.cfg.JobType)
	addParam("salary", a.cfg.Salary)
	addList("experience", a.cfg.Experience)
	addList("degree", a.cfg.Degree)
	addList("scale", a.cfg.Scale)
	addList("industry", a.cfg.Industry)
	addList("stage", a.cfg.Stage)

	encoded := qs.Encode()
	if encoded == "" {
		return baseURL
	}
	return fmt.Sprintf("%s?%s", baseURL, encoded)
}

// TODO: the remaining browser automation logic (login, postJobByCity, resumeSubmission, etc.)
// will be implemented in the next iteration to achieve feature parity with the Java version.

func (a *App) login(page playwright.Page) error {
	if !a.cfg.OpenWindowsEnabled() && !a.hasCookieData() {
		log.Println("[boss] 未检测到Cookie，准备临时弹出浏览器完成首次登录…")
		if err := a.loginWithVisibleWindow(); err != nil {
			return err
		}
	}

	if play.CookieFileExists(a.cookieFile) {
		log.Println("[boss] 检测到历史Cookie，尝试加载…")
		if err := a.runner.LoadCookies(a.cookieFile); err != nil {
			log.Printf("[boss] 加载cookie失败: %v", err)
		} else {
			a.runner.InitStealth()
			log.Println("[boss] Cookie加载完成，已注入浏览器")
		}
	}

	log.Println("[boss] 正在访问Boss直聘主页…")
	if _, err := page.Goto(homeURL); err != nil {
		return fmt.Errorf("访问主页失败: %w", err)
	}
	log.Println("[boss] 主页加载完成，开始检查滑块验证…")
	sleepRandom(800, 1500)
	if err := a.waitForSlider(page); err != nil {
		return err
	}
	log.Println("[boss] 滑块验证检查完毕")

	log.Println("[boss] 检查登录状态…")
	required, err := a.isLoginRequired(page)
	if err != nil {
		return err
	}
	if required {
		if !a.cfg.OpenWindowsEnabled() {
			log.Println("[boss] cookie失效，当前为无头模式，将临时弹出窗口完成扫码登录…")
			if err := a.loginWithVisibleWindow(); err != nil {
				return err
			}
			if err := a.reloadHeadlessSession(page); err != nil {
				return err
			}
			log.Println("[boss] 登录已完成，继续无头执行…")
			return nil
		}
		log.Println("[boss] cookie失效，尝试扫码登录…")
		if err := a.scanLogin(page); err != nil {
			return err
		}
		if err := a.runner.SaveCookies(a.cookieFile); err != nil {
			log.Printf("[boss] 保存cookie失败: %v", err)
		}
	}
	return nil
}

func (a *App) loginWithVisibleWindow() error {
	runner, err := play.NewRunner(false)
	if err != nil {
		return fmt.Errorf("创建临时浏览器失败: %w", err)
	}
	defer runner.Close()

	page := runner.Page()
	runner.InitStealth()
	log.Println("[boss] 已弹出浏览器，请扫码登录…")
	log.Println("[boss] (临时窗口) 正在打开 Boss 主页…")
	if _, err := page.Goto(homeURL); err != nil {
		return fmt.Errorf("可视化登录访问主页失败: %w", err)
	}
	log.Println("[boss] (临时窗口) 主页加载完成，等待滑块验证…")
	sleepRandom(800, 1500)
	if err := a.waitForSlider(page); err != nil {
		return err
	}
	log.Println("[boss] (临时窗口) 滑块验证通过，进入扫码流程…")
	if err := a.scanLogin(page); err != nil {
		return err
	}
	if err := runner.SaveCookies(a.cookieFile); err != nil {
		return fmt.Errorf("保存登录后的cookie失败: %w", err)
	}
	log.Println("[boss] (临时窗口) 登录完成，Cookie 已写入本地")
	return nil
}

func (a *App) reloadHeadlessSession(page playwright.Page) error {
	if err := a.runner.LoadCookies(a.cookieFile); err != nil {
		return fmt.Errorf("加载最新cookie失败: %w", err)
	}
	if _, err := page.Goto(homeURL); err != nil {
		return fmt.Errorf("刷新无头浏览器状态失败: %w", err)
	}
	sleepRandom(600, 1200)
	if err := a.waitForSlider(page); err != nil {
		return err
	}
	required, err := a.isLoginRequired(page)
	if err != nil {
		return err
	}
	if required {
		return errors.New("登录后仍检测到未登录状态，请重试")
	}
	return nil
}

func (a *App) hasCookieData() bool {
	data, err := os.ReadFile(a.cookieFile)
	if err != nil {
		return false
	}
	var cookies []map[string]interface{}
	if err := json.Unmarshal(data, &cookies); err == nil {
		return len(cookies) > 0
	}
	trimmed := strings.TrimSpace(string(data))
	return trimmed != "" && trimmed != "[]"
}

func (a *App) postJobByCity(page playwright.Page, city string) error {
	searchURL := a.buildSearchURL(city)
	for _, keyword := range a.cfg.Keywords {
		if !a.canSendMore() {
			log.Printf("[boss] 已达每日投递上限(%d)，停止后续关键词处理", a.maxChats)
			return nil
		}
		encoded := url.QueryEscape(keyword)
		target := fmt.Sprintf("%s&query=%s", searchURL, encoded)
		log.Printf("[boss] 投递地址:%s", searchURL+"&query="+keyword)
		if _, err := page.Goto(target); err != nil {
			return fmt.Errorf("打开搜索页失败: %w", err)
		}
		if err := page.Locator(jobListContainer).WaitFor(); err != nil {
			log.Printf("[boss] 等待岗位列表失败: %v", err)
		}

		cards := page.Locator(jobCardSelector)
		lastCount := -1
		for {
			if _, err := page.Evaluate("() => window.scrollTo(0, document.body.scrollHeight)", nil); err != nil {
				return err
			}
			sleepRandom(700, 1500)
			count, err := cards.Count()
			if err != nil {
				return err
			}
			if count == lastCount {
				break
			}
			lastCount = count
		}
		log.Printf("[boss] 【%s】岗位已全部加载，总数:%d", keyword, lastCount)
		_, _ = page.Evaluate("() => window.scrollTo(0, 0)", nil)
		sleepRandom(500, 1200)

		count, err := cards.Count()
		if err != nil {
			return err
		}
		postCount := 0
		for i := 0; i < count; i++ {
			if !a.canSendMore() {
				log.Printf("[boss] 已达每日投递上限(%d)，停止当前关键词剩余岗位", a.maxChats)
				return nil
			}
			cards = page.Locator(jobCardSelector)
			if err := cards.Nth(i).Click(); err != nil {
				log.Printf("[boss] 点击岗位卡片失败: %v", err)
				continue
			}
			sleepRandom(500, 900)

			detail := page.Locator(jobDetailBox)
			if err := detail.WaitFor(playwright.LocatorWaitForOptions{Timeout: playwright.Float(4000)}); err != nil {
				continue
			}
			detail = detail.Nth(0)

			jobName := safeText(detail, jobNameSelector)
			if jobName == "" || a.black.JobBlocked(jobName) {
				continue
			}
			salary := decodeSalary(safeText(detail, jobSalarySelector))
			tags := safeAllText(detail, jobTagSelector)
			jobDesc := safeText(detail, jobDescSelector)
			bossNameRaw := safeText(detail, bossNameSelector)
			bossName, bossActive := splitBossName(bossNameRaw)
			if a.cfg.FilterDeadHR && containsDeadStatus(bossActive, a.cfg.DeadStatus) {
				continue
			}
			bossTitleRaw := safeText(detail, bossInfoSelector)
			companyName, recruiterTitle := splitBossTitle(bossTitleRaw)
			if a.black.CompanyBlocked(companyName) || a.black.RecruiterBlocked(recruiterTitle) {
				continue
			}

			job := Job{
				JobName:     jobName,
				Salary:      salary,
				JobArea:     strings.Join(tags, ", "),
				JobInfo:     jobDesc,
				CompanyName: companyName,
				Recruiter:   bossName,
			}

			if !a.jobMatchesProfile(keyword, job) {
				log.Printf("[boss] 职位[%s] 与个人介绍不匹配，自动跳过", job.JobName)
				continue
			}

			_, err := a.resumeSubmission(page, keyword, &job)
			if err != nil {
				log.Printf("[boss] 投递岗位失败: %v", err)
			}
			postCount++
		}
		log.Printf("[boss] 【%s】岗位已投递完毕！已投递岗位数量:%d", keyword, postCount)
	}
	return nil
}

func (a *App) resumeSubmission(page playwright.Page, keyword string, job *Job) (bool, error) {
	sleepRandom(500, 1000)

	moreBtn := page.Locator(moreJobButton)
	if count, err := moreBtn.Count(); err != nil || count == 0 {
		log.Printf("[boss] 未找到查看更多信息按钮，跳过岗位:%s", job.JobName)
		return false, nil
	}
	href, err := moreBtn.Nth(0).GetAttribute("href")
	if err != nil || !strings.HasPrefix(href, "/job_detail/") {
		log.Printf("[boss] 未获取到岗位详情链接，跳过岗位:%s", job.JobName)
		return false, nil
	}
	detailURL := homeURL + href
	job.Href = detailURL

	detailPage, err := page.Context().NewPage()
	if err != nil {
		return false, err
	}
	defer func() {
		_ = detailPage.Close()
		sleepRandom(500, 1000)
	}()
	extraPages := make([]playwright.Page, 0, 2)
	defer func() {
		for _, p := range extraPages {
			if p == nil {
				continue
			}
			_ = p.Close()
			sleepRandom(200, 400)
		}
	}()

	if _, err := detailPage.Goto(detailURL); err != nil {
		return false, err
	}
	sleepRandom(600, 1200)

	chatBtn := detailPage.Locator("a.btn-startchat, a.op-btn-chat")
	found := false
	for i := 0; i < 5; i++ {
		if count, err := chatBtn.Count(); err == nil && count > 0 {
			text, _ := chatBtn.Nth(0).TextContent()
			if strings.Contains(text, "立即沟通") {
				found = true
				break
			}
		}
		sleepRandom(500, 900)
	}
	if !found {
		log.Printf("[boss] 未找到立即沟通按钮，跳过岗位:%s", job.JobName)
		return false, nil
	}
	chatPage := detailPage
	popup, err := detailPage.Context().ExpectPage(func() error {
		return chatBtn.Nth(0).Click()
	}, playwright.BrowserContextExpectPageOptions{Timeout: playwright.Float(2000)})
	if err != nil && !errors.Is(err, playwright.ErrTimeout) {
		return false, err
	}
	if popup != nil {
		chatPage = popup
		extraPages = append(extraPages, popup)
	}
	sleepRandom(500, 900)

	chatPage, inputLocator, ready := a.waitForChatInput(chatPage, &extraPages)
	if !ready {
		log.Printf("[boss] 聊天输入框未出现，跳过岗位:%s", job.JobName)
		return false, nil
	}

	message := strings.ReplaceAll(strings.ReplaceAll(a.cfg.SayHi, "\r", ""), "\n", "")
	if a.cfg.EnableAI && a.ai != nil && job.JobInfo != "" {
		if ok, aiMsg := a.checkJob(keyword, job.JobName, job.JobInfo); ok && aiMsg != "" {
			message = aiMsg
		}
	}

	input := inputLocator.Nth(0)
	_ = input.Click()
	tagNameRaw, _ := input.Evaluate("el => el.tagName", nil)
	tagName, _ := tagNameRaw.(string)
	if strings.EqualFold(tagName, "textarea") {
		if err := input.Fill(message); err != nil {
			return false, err
		}
	} else {
		if _, err := input.Evaluate("(el, msg) => el.innerText = msg", message); err != nil {
			return false, err
		}
	}

	imgResume := false
	if a.cfg.SendImgResume {
		if resumePath := resolveResumePath(); resumePath != "" {
			uploader := chatPage.Locator(imageUploadSelector)
			if count, err := uploader.Count(); err == nil && count > 0 {
				if err := uploader.Nth(0).SetInputFiles(resumePath); err == nil {
					imgResume = true
				}
			}
		}
	}

	sendBtn := chatPage.Locator(sendButtonSelector)
	sendSuccess := false
	if count, err := sendBtn.Count(); err == nil && count > 0 {
		if err := sendBtn.Nth(0).Click(); err == nil {
			sleepRandom(500, 900)
			sendSuccess = true
		}
	}
	if !sendSuccess {
		log.Printf("[boss] 未找到发送按钮，自动跳过！岗位：%s", job.JobName)
	}
	log.Printf("[boss] 投递完成 | 岗位：%s | 招呼语：%s | 图片简历：%s", job.JobName, message, map[bool]string{true: "已发送", false: "未发送"}[imgResume])

	if sendSuccess {
		a.results = append(a.results, *job)
		a.incrementDailyCount()
		a.notifyJobSuccess(job, message)
	}
	return sendSuccess, nil
}

func (a *App) waitForChatInput(page playwright.Page, extraPages *[]playwright.Page) (playwright.Page, playwright.Locator, bool) {
	active := page
	for i := 0; i < 20; i++ {
		if locator := a.visibleChatInput(active); locator != nil {
			return active, locator, true
		}
		if newPage, clicked := a.clickContinueChat(active); clicked {
			if newPage != nil {
				active = newPage
				if extraPages != nil {
					*extraPages = append(*extraPages, newPage)
				}
			}
			continue
		}
		sleepRandom(500, 900)
	}
	return active, nil, false
}

func (a *App) visibleChatInput(page playwright.Page) playwright.Locator {
	locator := page.Locator(chatInputSelector)
	count, err := locator.Count()
	if err != nil || count == 0 {
		return nil
	}
	visible, _ := locator.Nth(0).IsVisible()
	if !visible {
		return nil
	}
	return locator
}

func (a *App) clickContinueChat(page playwright.Page) (playwright.Page, bool) {
	roleLocators := []playwright.Locator{
		page.GetByRole("link", playwright.PageGetByRoleOptions{Name: "继续沟通"}),
		page.GetByRole("button", playwright.PageGetByRoleOptions{Name: "继续沟通"}),
	}
	selectors := []string{
		fmt.Sprintf("%s >> text=/继续\\s*沟通/", dialogContainer),
		"text=/继续\\s*沟通/",
		"a:has-text(\"继续沟通\")",
		"button:has-text(\"继续沟通\")",
		"[role='button']:has-text(\"继续沟通\")",
		"[role='link']:has-text(\"继续沟通\")",
		"//a[contains(., '继续沟通')]",
		"//button[contains(., '继续沟通')]",
	}
	locators := append([]playwright.Locator{}, roleLocators...)
	for _, selector := range selectors {
		locators = append(locators, page.Locator(selector))
	}

	ctx := page.Context()
	for _, loc := range locators {
		if loc == nil {
			continue
		}
		count, err := loc.Count()
		if err != nil || count == 0 {
			continue
		}
		for i := 0; i < count; i++ {
			btn := loc.Nth(i)
			if btn == nil {
				continue
			}
			visible, err := btn.IsVisible()
			if err != nil {
				continue
			}
			if !visible {
				_ = btn.ScrollIntoViewIfNeeded()
				visible, _ = btn.IsVisible()
			}
			if !visible {
				continue
			}

			before := ctx.Pages()
			if err := btn.Click(); err != nil {
				log.Printf("[boss] 点击“继续沟通”失败: %v", err)
				continue
			}
			sleepRandom(400, 700)

			for attempt := 0; attempt < 6; attempt++ {
				now := ctx.Pages()
				if popup := findNewPage(before, now); popup != nil {
					_ = popup.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
						State:   playwright.LoadStateDomcontentloaded,
						Timeout: playwright.Float(5000),
					})
					log.Printf("[boss] 检测到“继续沟通”确认弹窗，已自动切换到新页面")
					return popup, true
				}
				time.Sleep(150 * time.Millisecond)
			}

			_ = page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
				State:   playwright.LoadStateDomcontentloaded,
				Timeout: playwright.Float(4000),
			})
			if err := page.WaitForURL("**/chat**", playwright.PageWaitForURLOptions{
				Timeout: playwright.Float(2000),
			}); err == nil {
				log.Printf("[boss] 点击“继续沟通”后进入聊天页面")
			} else {
				log.Printf("[boss] 已点击“继续沟通”，等待聊天页面加载")
			}
			return nil, true
		}
	}
	return nil, false
}

func findNewPage(before, after []playwright.Page) playwright.Page {
	seen := make(map[playwright.Page]struct{}, len(before))
	for _, p := range before {
		if p == nil {
			continue
		}
		seen[p] = struct{}{}
	}
	for _, p := range after {
		if p == nil {
			continue
		}
		if _, ok := seen[p]; !ok {
			return p
		}
	}
	return nil
}

func (a *App) updateListData() error {
	page := a.runner.Page()
	if _, err := page.Goto("https://www.zhipin.com/web/geek/chat"); err != nil {
		return err
	}
	sleepRandom(2000, 3500)

	for {
		finished := page.Locator(finishedText)
		if count, err := finished.Count(); err == nil && count > 0 {
			text, _ := finished.Nth(0).TextContent()
			if strings.TrimSpace(text) == "没有更多了" {
				break
			}
		}

		companyLoc := page.Locator(companyNameInChat)
		messageLoc := page.Locator(lastMessageInChat)

		companyCount, err := companyLoc.Count()
		if err != nil {
			return err
		}
		messageCount, err := messageLoc.Count()
		if err != nil {
			return err
		}
		limit := companyCount
		if messageCount < limit {
			limit = messageCount
		}

		for i := 0; i < limit; i++ {
			companyName, err := companyLoc.Nth(i).TextContent()
			if err != nil {
				continue
			}
			message, err := messageLoc.Nth(i).TextContent()
			if err != nil {
				continue
			}
			companyName = strings.ReplaceAll(strings.TrimSpace(companyName), "...", "")
			message = strings.TrimSpace(message)
			if companyName == "" || message == "" {
				continue
			}
			if shouldBlacklistMessage(message) && !a.black.CompanyBlocked(companyName) && validCompanyName(companyName) {
				a.black.AddCompany(companyName)
				log.Printf("[boss] 黑名单公司：【%s】，信息：【%s】", companyName, message)
			}
		}

		scroll := page.Locator(scrollLoadMore)
		if count, err := scroll.Count(); err == nil && count > 0 {
			_ = scroll.Nth(0).ScrollIntoViewIfNeeded()
		} else {
			_, _ = page.Evaluate("() => window.scrollTo(0, document.body.scrollHeight)", nil)
		}
	}

	log.Printf("[boss] 黑名单公司数量：%d", len(a.black.Companies))
	return nil
}

func (a *App) composeResultMarkdown(summary, duration string) string {
	if len(a.results) == 0 {
		return summary
	}
	var sb strings.Builder
	sb.WriteString(summary)
	sb.WriteString("\n\n## 投递详情\n")
	sb.WriteString("| 岗位 | 公司 | 城市/经验 | 状态 |\n")
	sb.WriteString("| --- | --- | --- | --- |\n")
	for _, job := range a.results {
		jobLink := escapeMarkdown(job.JobName)
		if job.Href != "" {
			jobLink = fmt.Sprintf("[%s](%s)", escapeMarkdown(job.JobName), job.Href)
		}
		company := escapeMarkdown(job.CompanyName)
		area := escapeMarkdown(job.JobArea)
		sb.WriteString(fmt.Sprintf("| %s | %s | %s | ✅ 已发起沟通 |\n", jobLink, company, area))
	}
	sb.WriteString("\n> 用时：" + duration)
	return sb.String()
}

func escapeMarkdown(text string) string {
	replacer := strings.NewReplacer("|", "\\|", "[", "\\[", "]", "\\]", "(", "\\(", ")", "\\)")
	return replacer.Replace(text)
}

func (a *App) notifyJobSuccess(job *Job, greeting string) {
	if a.bot == nil {
		return
	}
	jobLink := escapeMarkdown(job.JobName)
	if job.Href != "" {
		jobLink = fmt.Sprintf("[%s](%s)", escapeMarkdown(job.JobName), job.Href)
	}
	data := map[string]string{
		"jobName":     escapeMarkdown(job.JobName),
		"jobLink":     jobLink,
		"jobHref":     job.Href,
		"companyName": escapeMarkdown(job.CompanyName),
		"jobArea":     escapeMarkdown(job.JobArea),
		"salary":      escapeMarkdown(job.Salary),
		"greeting":    escapeMarkdown(greeting),
		"status":      "✅ 已发起沟通",
		"timestamp":   time.Now().Format("2006-01-02 15:04:05"),
	}
	a.bot.SendTemplate(data)
}

func today() string {
	return time.Now().Format("2006-01-02")
}

func sleepRandom(minMs, maxMs int) {
	if maxMs <= minMs {
		maxMs = minMs + 1
	}
	delay := rand.Intn(maxMs-minMs) + minMs
	time.Sleep(time.Duration(delay) * time.Millisecond)
}

func loadDailyCounter(path string) (*DailyCounter, error) {
	if data, err := os.ReadFile(path); err == nil {
		var counter DailyCounter
		if err := json.Unmarshal(data, &counter); err == nil {
			counter.resetIfNeeded()
			return &counter, nil
		}
	}
	return newDailyCounter(), nil
}

func (a *App) saveDailyCounter() {
	if a.stats == nil || a.statsFile == "" {
		return
	}
	a.stats.resetIfNeeded()
	data, err := json.MarshalIndent(a.stats, "", "  ")
	if err != nil {
		log.Printf("[boss] 保存投递计数失败: %v", err)
		return
	}
	if err := os.MkdirAll(filepath.Dir(a.statsFile), 0o755); err != nil {
		log.Printf("[boss] 创建投递计数目录失败: %v", err)
		return
	}
	if err := os.WriteFile(a.statsFile, data, 0o644); err != nil {
		log.Printf("[boss] 写入投递计数失败: %v", err)
	}
}

func (a *App) canSendMore() bool {
	if a.maxChats <= 0 || a.stats == nil {
		return true
	}
	a.stats.resetIfNeeded()
	return a.stats.Count < a.maxChats
}

func (a *App) incrementDailyCount() {
	if a.stats == nil {
		return
	}
	a.stats.resetIfNeeded()
	a.stats.Count++
	a.saveDailyCounter()
}

func (a *App) jobMatchesProfile(keyword string, job Job) bool {
	if !a.cfg.EnableAI || a.ai == nil {
		return true
	}
	if job.JobInfo == "" {
		return true
	}
	if err := a.ensureAiReady(); err != nil {
		log.Printf("[boss] AI检测失败，跳过职位[%s]：%v", job.JobName, err)
		return false
	}
	prompt := fmt.Sprintf("请根据以下个人介绍与职位信息判断是否匹配，匹配仅回复true，不匹配仅回复false。个人介绍：%s。职位：%s（关键词：%s）。职位描述：%s", a.aiCfg.Introduce, job.JobName, keyword, job.JobInfo)
	resp, err := a.ai.Chat(prompt)
	if err != nil {
		log.Printf("[boss] 职位[%s] 匹配检测失败：%v", job.JobName, err)
		return false
	}
	return parseAiBoolean(resp)
}

func parseAiBoolean(resp string) bool {
	lower := strings.ToLower(strings.TrimSpace(resp))
	switch {
	case strings.Contains(lower, "false"), strings.Contains(lower, "不匹配"), strings.Contains(lower, "不合适"), strings.Contains(lower, "no"):
		return false
	case strings.Contains(lower, "true"), strings.Contains(lower, "匹配"), strings.Contains(lower, "合适"), strings.Contains(lower, "yes"):
		return true
	default:
		return false
	}
}

func validateAiClient(client *ai.Client) error {
	if client == nil {
		return nil
	}
	if _, err := client.Chat("你好"); err != nil {
		return err
	}
	return nil
}

func (a *App) ensureAiReady() error {
	if a.aiReady == nil {
		return nil
	}
	a.aiOnce.Do(func() {
		a.aiReadyErr = <-a.aiReady
	})
	return a.aiReadyErr
}

func (a *App) waitForSlider(page playwright.Page) error {
	const sliderURL = "https://www.zhipin.com/web/user/safe/verify-slider"
	deadline := time.Now().Add(5 * time.Minute)
	for time.Now().Before(deadline) {
		if strings.HasPrefix(page.URL(), sliderURL) {
			log.Println("[boss] 检测到滑块验证页面，等待手动完成…")
			fmt.Println("\n【滑块验证】请手动完成Boss直聘滑块验证，通过后在控制台回车继续…")
			_, _ = fmt.Scanln()
			sleepRandom(600, 1200)
			continue
		}
		return nil
	}
	return errors.New("滑块验证超时")
}

func (a *App) isLoginRequired(page playwright.Page) (bool, error) {
	locator := page.Locator(loginButtons)
	if count, err := locator.Count(); err == nil && count > 0 {
		text, err := locator.TextContent()
		if err == nil && strings.Contains(text, "登录") {
			return true, nil
		}
		return false, nil
	}

	header := page.Locator(pageHeader)
	if err := header.WaitFor(); err == nil {
		errorLogin := page.Locator(errorPageLogin)
		if count, err := errorLogin.Count(); err == nil && count > 0 {
			_ = errorLogin.Click()
			return true, nil
		}
	}
	log.Println("[boss] cookie有效，已登录…")
	return false, nil
}

func (a *App) scanLogin(page playwright.Page) error {
	if _, err := page.Goto(homeURL + "/web/user/?ka=header-login"); err != nil {
		return fmt.Errorf("进入登录页失败: %w", err)
	}
	sleepRandom(600, 1200)

	loginBtn := page.Locator(loginBtn)
	if count, err := loginBtn.Count(); err == nil && count > 0 {
		if text, err := loginBtn.TextContent(); err == nil && text != "登录" {
			log.Println("[boss] 已经登录，直接开始投递…")
			return nil
		}
	}

	log.Println("[boss] 等待登录…")
	if err := page.Locator(loginScanSwitch).Click(); err != nil {
		return fmt.Errorf("点击二维码登录按钮失败: %w", err)
	}

	start := time.Now()
	timeout := 10 * time.Minute
	for {
		if time.Since(start) >= timeout {
			return errors.New("超过10分钟未完成登录，程序退出")
		}
		locator := page.Locator(jobListContainer)
		if count, err := locator.Count(); err == nil && count > 0 {
			visible, _ := locator.First().IsVisible()
			if visible {
				log.Println("[boss] 用户已登录！")
				return nil
			}
		}
		time.Sleep(2 * time.Second)
	}
}

func safeText(root playwright.Locator, selector string) string {
	if root == nil {
		return ""
	}
	node := root.Locator(selector)
	count, err := node.Count()
	if err != nil || count == 0 {
		return ""
	}
	text, err := node.Nth(0).InnerText()
	if err != nil {
		text, err = node.Nth(0).TextContent()
		if err != nil {
			return ""
		}
	}
	return strings.TrimSpace(text)
}

func safeAllText(root playwright.Locator, selector string) []string {
	if root == nil {
		return nil
	}
	result, err := root.Locator(selector).AllInnerTexts()
	if err != nil {
		return nil
	}
	for i := range result {
		result[i] = strings.TrimSpace(result[i])
	}
	return result
}

func splitBossName(raw string) (string, string) {
	parts := strings.Fields(strings.TrimSpace(raw))
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func splitBossTitle(raw string) (string, string) {
	parts := strings.Split(strings.TrimSpace(raw), " · ")
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], parts[1]
}

func decodeSalary(text string) string {
	mapping := map[rune]rune{
		'': '0', '': '1', '': '2', '': '3', '': '4',
		'': '5', '': '6', '': '7', '': '8', '': '9',
	}
	var b strings.Builder
	for _, r := range text {
		if mapped, ok := mapping[r]; ok {
			b.WriteRune(mapped)
		} else {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func resolveResumePath() string {
	candidates := []string{
		"assets/resume.jpg",
		"resume.jpg",
		"src/main/resources/resume.jpg",
	}
	for _, path := range candidates {
		info, err := os.Stat(path)
		if err == nil && !info.IsDir() {
			return path
		}
	}
	return ""
}

func (a *App) checkJob(keyword, jobName, jd string) (bool, string) {
	if a.ai == nil || !a.ai.Enabled() {
		return false, ""
	}
	if err := a.ensureAiReady(); err != nil {
		log.Printf("[boss] AI生成打招呼语失败：%v", err)
		return false, ""
	}
	prompt := fmt.Sprintf(a.aiCfg.Prompt, a.aiCfg.Introduce, keyword, jobName, jd, a.cfg.SayHi)
	resp, err := a.ai.Chat(prompt)
	if err != nil {
		log.Printf("[boss] AI请求失败: %v", err)
		return false, ""
	}
	if strings.Contains(strings.ToLower(resp), "false") {
		return false, ""
	}
	return true, strings.TrimSpace(resp)
}

func containsDeadStatus(active string, statuses []string) bool {
	for _, status := range statuses {
		if status != "" && strings.Contains(active, status) {
			return true
		}
	}
	return false
}

func shouldBlacklistMessage(message string) bool {
	message = strings.TrimSpace(message)
	if message == "" {
		return false
	}
	matches := []string{"不", "感谢", "但", "遗憾", "需要本", "对不"}
	excludes := []string{"不是", "不生"}
	hasMatch := false
	for _, word := range matches {
		if strings.Contains(message, word) {
			hasMatch = true
			break
		}
	}
	if !hasMatch {
		return false
	}
	for _, word := range excludes {
		if strings.Contains(message, word) {
			return false
		}
	}
	return true
}

func validCompanyName(name string) bool {
	name = strings.TrimSpace(name)
	if name == "" {
		return false
	}
	chineseCount := 0
	letterCount := 0
	for _, r := range name {
		switch {
		case unicode.Is(unicode.Han, r):
			chineseCount++
			if chineseCount >= 2 {
				return true
			}
		case (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z'):
			letterCount++
			if letterCount >= 4 {
				return true
			}
		}
	}
	return false
}
