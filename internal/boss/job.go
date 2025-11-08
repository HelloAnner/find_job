package boss

import (
	"fmt"
	"strings"
)

// Job represents a single Boss直聘职位。
type Job struct {
	Href        string
	JobName     string
	Salary      string
	JobArea     string
	JobInfo     string
	CompanyName string
	Recruiter   string
}

func (j Job) String() string {
	if j.Href != "" {
		return fmt.Sprintf("【%s, %s, %s, %s, %s, %s】", j.CompanyName, j.JobName, j.JobArea, j.Salary, j.Recruiter, j.Href)
	}
	return fmt.Sprintf("【%s, %s, %s, %s, %s】", j.CompanyName, j.JobName, j.JobArea, j.Salary, j.Recruiter)
}

// Blacklists stores the recorded黑名单集合。
type Blacklists struct {
	Companies  map[string]struct{}
	Recruiters map[string]struct{}
	Jobs       map[string]struct{}
}

func newBlacklists() *Blacklists {
	return &Blacklists{
		Companies:  map[string]struct{}{},
		Recruiters: map[string]struct{}{},
		Jobs:       map[string]struct{}{},
	}
}

func (b *Blacklists) CompanyBlocked(name string) bool {
	return containsFromSet(b.Companies, name)
}

func (b *Blacklists) RecruiterBlocked(name string) bool {
	return containsFromSet(b.Recruiters, name)
}

func (b *Blacklists) JobBlocked(name string) bool {
	return containsFromSet(b.Jobs, name)
}

func (b *Blacklists) AddCompany(name string)   { addToSet(b.Companies, name) }
func (b *Blacklists) AddRecruiter(name string) { addToSet(b.Recruiters, name) }
func (b *Blacklists) AddJob(name string)       { addToSet(b.Jobs, name) }

func containsFromSet(set map[string]struct{}, target string) bool {
	if target == "" {
		return false
	}
	for entry := range set {
		if entry == "" {
			continue
		}
		if strings.Contains(target, entry) {
			return true
		}
	}
	return false
}

func addToSet(set map[string]struct{}, value string) {
	if value == "" {
		return
	}
	set[value] = struct{}{}
}
