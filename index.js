const PORT = process.env.port || 8080
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const url = require('url')
const fs = require('fs')
const app = express()

const links = []
const jobDescFrequencies = []

/// Utility Functions ////////////////////////////////////////////////////////////////

//Replace all occurences of value in string
function replaceAll(string, to_replace, replacement){
    const string_after_splitting = string.split(to_replace);
    return string_after_splitting.join(replacement);
}

//return list with unique elements 
function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

//Merge list of objects with different keys, add value of objects with same key
function mergObjcts(list) {
    console.log("Merging OBJECts")
    console.log(list)
    console.log(list[0])
    var objkeys = []
    for (let i=0;i<list.length;i++){
        objkeys = objkeys.concat(Object.keys(list[i]))
    }
    objkeys = uniq(objkeys)
    finalObj = {}
    
    for (let i=0;i<objkeys.length;i++){
        let count = 0
        for (let j=0;j<list.length;j++){
            if (list[j][objkeys[i]] == undefined) {
                continue
            } else {
                count += list[j][objkeys[i]]
            }
        
        }
        finalObj[objkeys[i]] = count
    }
    return finalObj
}

//Get the frequency of keywords in string
function wordFreq(string, keywords) {
    var words = string.replace(/[.]/g, '').split(/[\s()/,]/);
    var freqMap = {}
    keywords = keywords.map(keyword => keyword.toLowerCase())
    words = words.map(keyword => keyword.toLowerCase())
    words_keywords = []
    
    for(var i=0, l = words.length; i<l;i++) {
        if (keywords.includes(words[i])) {
            words_keywords.push(words[i])
        }
    }

    words_keywords.forEach(function(w) {
        if (!freqMap[w]) {
            freqMap[w] = 0;
        }
        freqMap[w] += 1;
    });

    return freqMap;
}
//Get all methods
const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
      Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function')
  }

//////////////////////////////////////////////////////////////////////////////////////


//call homepage with query localhost:8080/?jobTitle=x&location=y    &keywords=spark+python
app.get('/', (req,res) => {
    currentTime = Date.now()
    fs.open(`runs/${currentTime}.txt`,'w', function(err) {if (err) throw err})

    //res.write("Welcome to my API!\n")
    var q = url.parse(req.url, true).query
    keywords = q.keywords.split(" ")
    console.log(keywords)
    baseURL = `https://ca.linkedin.com/jobs/search?keywords=${replaceAll(q.jobTitle," ","+")}&location=${q.location}&trk=public_jobs_jobs-search-bar_search-submit`
    //res.write(baseURL+'\n')
    
    fs.appendFile(`runs/${currentTime}.txt`,`BaseURL: ${baseURL}\n\n`, function (err) {if (err) throw err})

    //runAPI(baseURL)
    
    axios.get(baseURL)
        .then((response) => {
            const html = response.data
            const $ = cheerio.load(html)
            console.log("Retriving Id's")

            $('ul[class="jobs-search__results-list"]').find('li > div > a').each(function () {
                const link = $(this).attr('href')
                console.log(link)
                links.push(link)
            })

            fs.appendFile(`runs/${currentTime}.txt`,`Links: \n - ${replaceAll(links.toString(),",","\n - ")}\n\nJson Data: \n`, function (err) {if (err) throw err})

            links.splice(-2).forEach(link => {
                setTimeout(function() {
                    axios.get(link)
                        .then((response) => {
                            const html = response.data
                            const $ = cheerio.load(html)
                            const jsondata = $("script[type='application/ld+json']").text()
                            fs.appendFile(`runs/${currentTime}.txt`, ` - ${jsondata}\n`, function (err) {if (err) throw err})
                            const description = JSON.parse(jsondata)['description']
                            console.log(wordFreq(description,keywords))
                            jobDescFrequencies.push(wordFreq(description,keywords))
                            //descs.push($("script[type='application/ld+json']").text())
                        }).catch(error => {
                            console.log(error)
                })},1000)
            //console.log(mergObjcts(jobDescFrequencies))
            //fs.writeFile('descriptions.txt', descs.toString(), err => {if (err) {console.log(err);}})
            //console.log(descs).catch(error => {console.log(error)})
            })
        console.log(mergObjcts(jobDescFrequencies))
        res.json(mergObjcts(jobDescFrequencies))
        //res.json()
    res.end()
    })
})



// async function runAPI(baseURL) {
//     try {
//         const promises = []
//         const response = await axios.get(baseURL)
//         const $ = cheerio.load(response.data)

//         $('ul[class="jobs-search__results-list"]').find('li > div > a').each(function () {
//             const link = $(this).attr('href')
//             promises.push(axios.get(link))
//         })

//         const jobPostPromises = await Promise.all(promises)
//         jobPostPromises.slice(-1).forEach(promise => {
//             const $ = cheerio.load(promise.data)
//             console.log($("script[type='application/ld+json']").text())
//         })

//     } catch(error) {
//         console.log(error)
//     }
    
// }   




app.get('/docs', (req,res) => {
    res.write('Docs coming soon...')
    res.end()
})


app.listen(PORT, () => console.log(`Starting server on port: ${PORT}`))
