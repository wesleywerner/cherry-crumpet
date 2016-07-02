var fs = require('fs');
var path = require('path');
var url = require('url');
var http = require('http');
var readline = require('readline');
var sanitize = require("sanitize-filename");
var marked = require('marked');
var serveStatic = require('serve-static');
var finalhandler = require('finalhandler');

var config = { };
var serve = serveStatic('public', {'index': ['index.html', 'index.htm']});

// Load configuration
fs.readFile(path.join(__dirname, 'app.json'), 'utf8', function (err, data) {
    if (err) {
        console.log(err);
    }
    else {
        config = JSON.parse(data);
        console.log('read config:'+data);
    }
});

function listener(req, res) {

    if (req.method == "GET") {
        // serve static files via GET
        return serve(req, res, finalhandler(req, res));
    }
    
    // Allow cors (varying ports are considered cross domain)
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');
    
    var body = "";
    req.on('data', function (chunk) {
        body += chunk;
    });
    req.on('end', function () {

        // No post variables here
        if (body == "") return res.end();
        
        ProcessRequest(req, res, body, function (err, data) {
            if (err) {
                res.writeHead(500);
                res.end(err.message);
                return;
            }
            else {
                // Write json data
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.write(data);
                res.end();
            }
        });
        
        
    });

    
}

function ProcessRequest (req, res, form, callback) {
    try {
        var purl = url.parse(req.url, true);
        var postdata = JSON.parse(form) || { };

        if (purl.pathname == '/api/list') {
            
            // TODO Cache the post list in memory.
            // Refresh the list every n calls, or if n minutes old.
            
            fs.readdir(path.join(__dirname, 'public/posts'), function(err, data) {
                if (err) return callback(err);

                data.sort().reverse();
                
                var page = postdata.page || 0;
                var max = postdata.max || (data.length);

                // optionally shift to the page beginning with a post key
                if (postdata.key && postdata.key.length > 0) {
                  //console.log('looking for key post: '+postdata.key);
                  var postindex=data.length;
                  for (;postindex;postindex--) {
                    if (data[postindex] == postdata.key) {
                      page = Math.floor(postindex / max);
                      //console.log('key post found on page '+page);
                      break;
                    }
                  }
                }

                // calculate pagination values
                var sliceFrom = page * max;
                var sliceTo = sliceFrom + max;

                var result = { };
                result.max = max;
                result.page = page;
                result.next = (data.length > sliceTo) ? page + 1 : page;
                result.prev = (page > 0) ? page - 1 : 0;
                result.posts = namify(data.slice(sliceFrom, sliceTo));
                var postlist = JSON.stringify(result);
                return callback(null, postlist);
            });
        }
        
        else if (purl.pathname == '/api/get') {

            if (postdata.key == null) {
                return callback({'message':'no post key given'});
            }
            
            var filename = path.join(__dirname, 'public/posts', sanitize(postdata.key));
            
            ReadPost(res, filename, function (err, data) {
                if (err) {
                    return callback(err, null);
                }
                else {
                    return callback(null, data);
                }
            });
            
        }

    }
    catch (err) {
        callback (err);
    }
}

function ReadPost (res, filename, callback) {
    try {
        fs.stat(filename, function (err, data) {
            if (err) {
                return callback(err);
            }
            fs.readFile(filename, 'utf8', function (err, data) {
                if (err) {
                    return callback(err);
                }
                else {
                    return callback(null, marked(data));
                }
            });
        });
    }
    catch (err) {
        return callback(err);
    }
}


/**
 * Takes an array of file names and builds
 * an array of name-key objects.
 * Attempts to extract a date from the filename.
 */
function namify(filelist) {

    var result = [];

    for (var i = 0; i < filelist.length; i++) {

        var file = filelist[i];

        // attempt to parse the first part as a date.
        var datepart = file.substring(0, 10);
        var dateval = Date.parse(datepart);
        var isdate = !isNaN(dateval);
        var title = '';
        
        if (isdate) {
            title = file.substring(datepart.length);
        }
        else {
            title = file;
        }

        // Remove the file extension
        title = title.replace(/\.md$/, '');
        
        var postItem = {
            'title': title,
            'key': file,
            'date': (isdate ? dateval : ''),
            'lead': ''
        };
        
        if (config.leads) {
            var array = fs.readFileSync(path.join(__dirname, 'public/posts', file)).toString().split('\n');
            if (array.length > 0) postItem.lead = array[0];
        }
        
        result.push(postItem);
        
    }

    return result;

}

var server = http.createServer(listener);
server.listen(process.env.PORT || 3000);
