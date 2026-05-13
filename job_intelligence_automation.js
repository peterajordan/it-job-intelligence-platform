/*
IT Job Intelligence Platform
Author: Peter Jordan

Description:
Automated IT job search and filtering platform using APIs,
automation workflows, and Google Sheets integrations.

Features:
- API job retrieval
- Duplicate filtering
- Opportunity scoring
- Remote job detection
- Google Sheets automation
*/
function buildRow(company, title, location, link, salary, fitScore, risk, priority) {
  return [
    company || "",
    title || "",
    location || "",
    link || "",
    salary || "",
    fitScore || "",
    risk || "",
    priority || "",
    new Date(),
    "Not Applied",
    "",
    "",
    ""
  ];
}

function sendTopJobsEmail(jobs) {
  var email = "YOUR EMAIL";

  if (!jobs.length) {
    MailApp.sendEmail(email, "📊 Job Script Ran", "No high priority jobs found this run.");
    return;
  }

  jobs.sort((a, b) => b.fitScore - a.fitScore);
  var topJobs = jobs.slice(0, 5);

  var subject = "🔥 Top 5 High Priority IT Jobs";
  var message = "Here are your top high-priority jobs:\n\n";

  topJobs.forEach(function(job, index) {
    message += (index + 1) + ". " + job.title + "\n";
    message += "Company: " + job.company + "\n";
    message += "Fit Score: " + job.fitScore + "\n";
    message += "Apply: " + job.link + "\n\n";
  });

  message += "Go apply while they’re fresh.";

  MailApp.sendEmail(email, subject, message);
}

function fetchAllJobs() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Jobs");

  var appId = "YOUR_APPID";
  var appKey = "YOUR_APPKEY";
  var rapidKey = "YOUR_RAPIDKEY";

  //  ADD YOUR INFO HERE
  var usaEmail = "YOUR_EMAIL_USED_FOR_KEY";
  var usaKey = "YOUR_USAKEY";
  // MODIFY YOUR SEARCH TO THE TITLES JOB YOU WANT TO APPLY
  var searches = [
    "systems analyst","IT support","microsoft 365 administrator",
    "systems administrator","business analyst","IT analyst",
    "helpdesk supervisor","helpdesk manager","cybersecurity analyst",
    "cloud engineer","security analyst","IT specialist",
    "IT Manager","Application Analyst","Network Analyst","cloud analyst"
  ];

  var locations = [
    "miami","fort lauderdale","doral","hialeah","homestead",
    "miami beach","north miami","sunrise","weston",
    "pembroke pines","davie","hollywood","coral springs",
    "miramar","miami lakes"
  ];

  var existingData = sheet.getDataRange().getValues();
  var existingJobs = new Set(
    existingData.map(row =>
      (row[0] + "|" + row[1] + "|" + row[2]).toLowerCase().trim()
    )
  );

  var rowsToAdd = [];
  var highPriorityJobs = [];

  // ===== ADZUNA =====
  searches.forEach(function(searchTerm) {
    var url = "https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=" + appId +
              "&app_key=" + appKey +
              "&what=" + encodeURIComponent(searchTerm) +
              "&where=florida&results_per_page=10";

    try {
      var response = UrlFetchApp.fetch(url);
      var data = JSON.parse(response.getContentText());

      data.results.forEach(function(job) {

        var title = String(job.title || "").toLowerCase();
        var location = String(job.location.display_name || "").toLowerCase();

        if (title.includes("intern") || title.includes("junior") || title.includes("principal") || title.includes("director")) return;

        var isRemote = title.includes("remote");
        var matchesLocation = locations.some(loc => location.includes(loc));

        if (matchesLocation || isRemote) {

          var companyName = job.company.display_name || "";
          var jobTitle = job.title || "";
          var jobLocation = job.location.display_name || "";

          var jobKey = (companyName + "|" + jobTitle + "|" + jobLocation).toLowerCase().trim();

          if (!existingJobs.has(jobKey)) {

            var company = companyName.toLowerCase();
            var fitScore = 5;
            var risk = "Medium";

            if (title.includes("systems analyst")) fitScore += 3;
            if (title.includes("administrator") || title.includes("microsoft 365")) fitScore += 2;
            if (title.includes("senior") || title.includes("lead")) fitScore += 1;
            if (title.includes("support")) fitScore -= 1;
            if (title.includes("helpdesk")) fitScore -= 2;
            if (job.salary_min && job.salary_min > 90000) fitScore += 1;

            if (company.includes("health") || company.includes("hospital") || company.includes("school") || company.includes("government")) fitScore += 1;
            if (title.includes("contract")) fitScore -= 2;

            fitScore = Math.max(1, Math.min(10, fitScore));

            if (company.includes("staffing") || company.includes("solutions") || company.includes("consulting")) {
              risk = "High";
            } else if (company.includes("health") || company.includes("university") || company.includes("government")) {
              risk = "Low";
            }

            var priority = "LOW";
            if (fitScore >= 8 && risk === "Low") priority = "HIGH";
            else if (fitScore >= 7) priority = "Medium";

            rowsToAdd.push(buildRow(companyName, jobTitle, jobLocation, job.redirect_url, job.salary_min, fitScore, risk, priority));
            existingJobs.add(jobKey);

            if (priority === "HIGH") {
              highPriorityJobs.push({ title: jobTitle, company: companyName, link: job.redirect_url, fitScore: fitScore });
            }
          }
        }
      });

    } catch (e) {
      Logger.log("Adzuna error: " + e);
    }
  });

  // ===== JSEARCH =====
  searches.forEach(function(searchTerm) {

    var url = "https://jsearch.p.rapidapi.com/search?query=" +
              encodeURIComponent(searchTerm + " in Miami, FL OR " + searchTerm + " remote") +
              "&page=1&num_pages=1";

    var options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
      }
    };

    try {
      var response = UrlFetchApp.fetch(url, options);
      var data = JSON.parse(response.getContentText());

      data.data.forEach(function(job) {

        var title = String(job.job_title || "").toLowerCase();
        var location = String(job.job_city || "").toLowerCase();

        if (title.includes("intern") || title.includes("junior") || title.includes("principal") || title.includes("director")) return;

        var isRemote = title.includes("remote");
        var matchesLocation = locations.some(loc => location.includes(loc));

        if (matchesLocation || isRemote) {

          var companyName = job.employer_name || "";
          var jobTitle = job.job_title || "";
          var jobLocation = job.job_city || "Remote";

          var jobKey = (companyName + "|" + jobTitle + "|" + jobLocation).toLowerCase().trim();

          if (!existingJobs.has(jobKey)) {

            var company = companyName.toLowerCase();
            var fitScore = 5;
            var risk = "Medium";

            if (title.includes("systems analyst")) fitScore += 3;
            if (title.includes("administrator") || title.includes("microsoft 365")) fitScore += 2;
            if (title.includes("senior") || title.includes("lead")) fitScore += 1;
            if (title.includes("support")) fitScore -= 1;
            if (title.includes("helpdesk")) fitScore -= 2;

            if (company.includes("health") || company.includes("hospital") || company.includes("school") || company.includes("government")) fitScore += 1;
            if (title.includes("contract")) fitScore -= 2;

            fitScore = Math.max(1, Math.min(10, fitScore));

            if (company.includes("staffing") || company.includes("solutions") || company.includes("consulting")) risk = "High";
            else if (company.includes("health") || company.includes("university") || company.includes("government")) risk = "Low";

            var priority = "LOW";
            if (fitScore >= 8 && risk === "Low") priority = "HIGH";
            else if (fitScore >= 7) priority = "Medium";

            rowsToAdd.push(buildRow(companyName, jobTitle, jobLocation, job.job_apply_link, "", fitScore, risk, priority));
            existingJobs.add(jobKey);

            if (priority === "HIGH") {
              highPriorityJobs.push({ title: jobTitle, company: companyName, link: job.job_apply_link, fitScore: fitScore });
            }
          }
        }
      });

    } catch (e) {
      Logger.log("JSearch error: " + e);
    }
  });

  // ===== USAJOBS =====
  searches.forEach(function(searchTerm) {

    var url = "https://data.usajobs.gov/api/search?Keyword=" +
              encodeURIComponent(searchTerm) +
              "&LocationName=Florida&ResultsPerPage=10";

    var options = {
      method: "GET",
      headers: {
        "User-Agent": usaEmail,
        "Authorization-Key": usaKey
      }
    };

    try {
      var response = UrlFetchApp.fetch(url, options);
      var data = JSON.parse(response.getContentText());

      var results = data.SearchResult.SearchResultItems;
      if (!results) return;

      results.forEach(function(item) {

        var job = item.MatchedObjectDescriptor;

        var title = String(job.PositionTitle || "").toLowerCase();
        var location = String(job.PositionLocationDisplay || "").toLowerCase();

        if (title.includes("intern") || title.includes("junior") || title.includes("principal") || title.includes("director")) return;

        if (location.includes("florida") || location.includes("remote")) {

          var companyName = job.OrganizationName || "US Government";
          var jobTitle = job.PositionTitle || "";
          var jobLocation = job.PositionLocationDisplay || "";
          var link = job.PositionURI || "";

          var jobKey = (companyName + "|" + jobTitle + "|" + jobLocation).toLowerCase().trim();

          if (!existingJobs.has(jobKey)) {

            var fitScore = 6;
            var risk = "Low";

            if (title.includes("systems")) fitScore += 2;
            if (title.includes("security") || title.includes("cyber")) fitScore += 2;
            if (title.includes("administrator")) fitScore += 2;

            fitScore = Math.max(1, Math.min(10, fitScore));

            var priority = fitScore >= 8 ? "HIGH" : "Medium";

            rowsToAdd.push(buildRow(companyName, jobTitle, jobLocation, link, "", fitScore, risk, priority));
            existingJobs.add(jobKey);

            if (priority === "HIGH") {
              highPriorityJobs.push({ title: jobTitle, company: companyName, link: link, fitScore: fitScore });
            }
          }
        }
      });

    } catch (e) {
      Logger.log("USAJobs error: " + e);
    }
  });

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, 13).setValues(rowsToAdd);
  }

  sendTopJobsEmail(highPriorityJobs);
}