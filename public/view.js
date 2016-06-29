(function(){
  
  var view = window.view = { };
  
  view.pages = ['News', 'About', 'Contact' ];
  view.section = ko.observable('');
  
  view.section.subscribe(function (page) {
    view.loadSection(page);
  });
  
  view.loadSection = function (page) {
    document.getElementById('foo').value = page;
    view.listPosts();
  };
  
  view.post = ko.observable('');
  view.posts = ko.observableArray([]);
  view.page = ko.observable(0);
  view.prev = ko.observable(0);
  view.next = ko.observable(0);
  view.max = ko.observable(3);
  
  // This helper function performs a POST request
  // and calls back when the request completed.
  // The callback should receive parameters as
  // func (err, data)
  view.PostRequest = function (url, data, callback) {
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

  view.listPosts = function () {
    
    var params = { page: view.page(), max: view.max() };
    
    //alert(JSON.stringify(params));
    
    view.PostRequest("/api/list", params, function(err, data) {
      if (err) {
        alert(err);
      }
      else {
        
        // Parse the data into a js object
        var result = JSON.parse(data);
        view.page(result.page);
        view.prev(result.prev);
        view.next(result.next);

        // read the returned view state
        view.posts(ko.mapping.fromJS(result.posts)());
        
      }
    });
  }

  view.loadPost = function (e) {
    view.PostRequest("/api/get", { "key": e.key() }, function(err, data) {
      if (err) {
        alert(err);
      }
      else {
        view.post(data);
        //document.getElementById('permalink').setAttribute('href', '#'+e.key);
        //document.getElementById('post').innerHTML = data;
      }
    });
  }
  
  view.clearPost = function () {
    view.post('');
  }
  
  view.goPrevPage = function () {
    view.page(view.prev());
    view.listPosts();
  }
  
  view.goNextPage = function () {
    view.page(view.next());
    view.listPosts();
  }
  
  ko.applyBindings(view);
  view.section(view.pages[0]);
  
})();
