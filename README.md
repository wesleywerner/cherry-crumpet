# cherry-crumpet

Serve markdown files over a node API

Cherry crumpet can be run stand-alone using the standard web port 80.

It can also be run in tandem with another web server of your choice, using whichever port you designate to the PORT environment variable. When using this setup, you would need to configure your web server to perform a forward proxy for `api/` paths (the ProxyPass directive in Apache for example).

* Any `GET` request will serve files from the `public` directory.
* Any `POST` request will access the API to retrieve post listings and content.

# Examples

Get list of posts, 10 posts per page, for page #3:

    var parameters = { 'page':3, 'max':10 }

    PostRequest("/api/list", parameters, function(err, data) {
        if (err) {
          alert(err);
        }
        else {
            console.log(data);
            // {"max":10,"page":3,"next":3,"prev":2,"posts":[{"title":" Simple Post","key":"2016-06-22 Simple Post.md","date":1466553600000,"lead":"A simple post"}]}
        }
    })}

Get the contents of a post:

    PostRequest("/api/get", { "key": "2016-06-25 Post 1.md" }, function(err, data) {
        if (err) {
            alert(err);
        }
        else {
            console.log(data);
            // <p>rendered markdown</p>
        }
    });

A vanillaJS helper function to send `POST`'s:

    // This helper function performs a POST request
    // and calls back when the request completed.
    // The callback should receive parameters as
    // func (err, data)
    function PostRequest(url, data, callback) {
      var r = new XMLHttpRequest(); 
      r.open("POST", url, true); 
      r.onreadystatechange = function () {
        // wait until the request is Done
        if (r.readyState != 4) return;
        // Test the success code
        if (r.status == 200) {
          callback(null, r.responseText);
        }
        else {
          callback(r.responseText);
        }
      }; 
      r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      r.send(JSON.stringify(data));
    }

# API

Whenever POST parameters are expected, they should be given as a JSON object.

## Listing Posts

Gets a list of posts that live under `public/posts`.

Path: `/api/list`


**Parameters**

* `page`: the pagination page number. First page is 0.
* `max`: the maximum posts per page to return.
* `key`: _optional_. Jump to the page that features this post key. This overrides the `page` parameter if the key is found. The idea is to provide easy permalinks by setting the key to `window.location.hash.slice(1)`, for example.

If no parameters are posted, then all posts are returned on one page.

**Returns**

A JSON object similar to this structure:

    {
        page: 3,    // current page
        max: 10,    // posts per page
        prev: 2,    // previous page
        next: 4,    // next page
        posts: [ { title, key, date, lead } ]
    }

## Get Post Content

Gets mardown formatted post content:

Path: `/api/get`

**Parameters**

* `key`: Match the post key obtained from previous calls to `/api/list`.

**Returns**

HTML rendered markdown.

## Searching (not implemented)

Search post contents

Path: `/api/search`

**Parameters**

* `since`: `Date`, Posts with dates after this value
* `until`: `Date`, Posts with dates before this value
* `limit`: `Int`, Limit results to this amount of posts
* `text`: `String`, The text to find

Expected date format: ISO date format

**Returns**

A search result object

    {
        since: '',
        until: '',
        limit: '',
        text: '',
        posts: [ { title, key, date, context } ]
    }

# Configuration

The file `app.json` provides configurable settings:

* leads: Load the first line in each post as the lead text.

# Modules used

Cherry Crumpet uses these following npm modules.

### File processing

* sanitize-filename
* marked

### Static file serving

* serve-static
  * finalhandler
