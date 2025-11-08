package boss

const (
	loginBtn        = "//li[@class='nav-figure']"
	loginScanSwitch = "//div[@class='btn-sign-switch ewm-switch']"

	jobListContainer = "//div[@class='job-list-container']"
	jobCardSelector  = "//ul[contains(@class, 'rec-job-list')]//li[contains(@class, 'job-card-box')]"
	jobDetailBox     = "div[class*='job-detail-box']"

	jobListSelector   = "ul.rec-job-list li.job-card-box"
	jobNameSelector   = "span[class*='job-name']"
	jobSalarySelector = "span.job-salary"
	jobTagSelector    = "ul[class*='tag-list'] > li"
	jobDescSelector   = "p.desc"
	bossNameSelector  = "h2[class*='name']"
	bossInfoSelector  = "div[class*='boss-info-attr']"
	moreJobButton     = "a.more-job-btn"

	chatListItem      = "//li[@role='listitem']"
	companyNameInChat = "//div[@class='title-box']/span[@class='name-box']//span[2]"
	lastMessageInChat = "//div[@class='gray last-msg']/span[@class='last-msg-text']"
	finishedText      = "//div[@class='finished']"
	scrollLoadMore    = "//div[contains(text(), '滚动加载更多')]"

	dialogContainer = ".dialog-con"
	loginButtons    = "//div[@class='btns']"
	pageHeader      = "//h1"
	errorPageLogin  = "//a[@ka='403_login']"

	recruiterInfoSelector = "//div[@class='boss-info-attr']"
	hrActiveSelector      = "//span[@class='boss-active-time']"
	chatInputSelector     = "div#chat-input.chat-input[contenteditable='true'], textarea.input-area"
	sendButtonSelector    = "div.send-message, button[type='send'].btn-send, button.btn-send"
	imageUploadSelector   = "//div[@aria-label='发送图片']//input[@type='file']"
)
