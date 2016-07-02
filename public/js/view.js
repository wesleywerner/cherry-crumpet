(function(){
  
  var cherry = window.cherry = { };
  
  // Define list of custom pages.
  cherry.pages = ['News', 'About', 'Contact'];
  
  // Default to the first page
  cherry.nav = cherry.pages[0];
  
  // TODO replace with vue event
  //cherry.nav.subscribe(function (page) {
    //cherry.loadSection(page);
  //});
  
  // TODO rename to refreshView
  cherry.loadSection = function (page) {
    cherry.listPosts();
  };
  
  // Store the post list data, and current post details
  cherry.model = { };
  
  // Flag when posts are loading
  cherry.loading = true;

  // Number of posts to list
  cherry.model.max = 3;
  
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
  
  cherry.goNewerPage = function () {
    window.location.hash = '';
    cherry.model.page = cherry.model.prev;
    cherry.listPosts();
  }
  
  cherry.goOlderPage = function () {
    window.location.hash = '';
    cherry.model.page = cherry.model.next;
    cherry.listPosts();
  }
  
  cherry.navigate = function (index) {
    // TODO boundary check
    cherry.nav = cherry.pages[index];
  }
  
  cherry.listPosts();
  
  cherry.vue = new Vue({
    el: '#cherry-app',
    data: cherry
  });
    
})();
