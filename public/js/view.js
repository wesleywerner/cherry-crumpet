(function(){
  
  var cherry = window.cherry = { };
  
  // Define list of custom pages.
  cherry.pages = ['News', 'About', 'Contact'];
  
  // Default to the first page
  cherry.nav = cherry.pages[0];
    
  // Store the post list data, and current post details
  cherry.model = { };
  
  // Store the current static page content
  cherry.staticPage = null;
  
  // Flag when posts are loading
  cherry.loading = true;

  // Number of posts to list
  cherry.model.max = 3;
  
  // Stores the search query
  cherry.searchQuery = '';
  cherry.isSearchList = false;
  
  // This helper function performs a POST request
  // and calls back when the request completed.
  // The callback should receive parameters as
  // func (err, data)
  cherry.PostRequest = function (url, data, callback) {
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

  cherry.listPosts = function () {
    
    cherry.loading = true;
    cherry.isSearchList = false;
    var params = { };
    params.page = cherry.model.page || 0;
    params.max = cherry.model.max || 3;
    params.key = window.location.hash.slice(1);
    
    cherry.PostRequest("/api/list", params, function(err, data) {
      cherry.loading = false;
      if (err) {
        alert(err);
      }
      else {
        // Parse the data into a js object
        var o = JSON.parse(data);
        // Format dates
        o.posts.forEach(function(post) {
          post.dateFromNow = moment(post.date).fromNow();
          post.dateCalendar = moment(post.date).calendar();
          post.body = null;
          post.loading = false;
        });
        cherry.model = o;
        
        // scroll to key post
        if (params.key) {
          window.setTimeout(function() {
          zenscroll.to(document.getElementById(params.key));
        }, 500);
        }
        
      }
    });
  }

  cherry.searchPosts = function () {
    
    if (cherry.searchQuery.length == 0) {
      cherry.listPosts();
      return;
    }
    
    // flag we are viewing searches
    cherry.isSearchList = true;
    cherry.loading = true;
    var params = { };
    params.query = cherry.searchQuery;
    
    cherry.PostRequest("/api/search", params, function(err, data) {
      cherry.loading = false;
      if (err) {
        alert(err);
      }
      else {
        // Parse the data into a js object
        var o = JSON.parse(data);
        // Format dates
        o.forEach(function(post) {
          post.dateFromNow = moment(post.date).fromNow();
          post.dateCalendar = moment(post.date).calendar();
          post.body = null;
          post.loading = false;
        });
        cherry.model.posts = o;
        cherry.model.page = 0;
        cherry.model.next = 0;
      }
    });
  }

  cherry.loadPost = function (index) {
    var e = cherry.model.posts[index];
    e.loading = true;
    cherry.PostRequest("/api/get", { "key": e.key }, function(err, data) {
      if (err) {
        alert(err);
      }
      else {
        e.body = data;
      }
      e.loading = false;
    });
  }
  
  cherry.loadPage = function (page) {
    cherry.loading = true;
    cherry.PostRequest("/api/page", { "key": page }, function(err, data) {
      if (err) {
        alert(err);
      }
      else {
        cherry.staticPage = data;
      }
      cherry.loading = false;
    });
  }
  
  // Scroll to top of page before reloading the post list
  cherry.goToPage = function (page) {
    zenscroll.to(document.body);
    window.setTimeout(function(){
      window.location.hash = '';
      cherry.model.page = page;
      cherry.listPosts();
    }, 1000);
  }

  cherry.goNewerPage = function () {
    cherry.goToPage(cherry.model.prev);
  }
  
  cherry.goOlderPage = function () {
    cherry.goToPage(cherry.model.next);
  }
  
  cherry.navigate = function (index) {
    // TODO boundary check
    cherry.nav = cherry.pages[index];
  }
  
  cherry.handleNavChange = function (navValue) {
    // The news page
    if (navValue == cherry.pages[0]) {
      cherry.listPosts();
    }
    else {
      // A static page
      cherry.loadPage (navValue);
    }
  }
  
  cherry.vue = new Vue({
    el: '#cherry-app',
    data: cherry,
    watch: {
      'nav': cherry.handleNavChange
    }
  });
  
  // On first load, trigger nav refresh
  cherry.handleNavChange (cherry.nav);
    
})();
