# job-keywordfreqAPI
Given a job title, location, and a few skills, the API returns the number of postings containing the skills in their job descriptions to help access the employability of skills. 

The API can be called from the home path "/" and queried with 3 parameters: jobTitle, location, and keywords. An exmaple call looks like this:
http://localhost:8080/?jobTitle=software+engineering+intern&location=toronto&keywords=python+java+spark+jira+git
The jobTitle is software+engineering+intern, the location is toronto, and the keywords are python+java+spark+jira+git+to
