//Wrap in an anonymous function so we dont pollute the global scope
(function(){
  'use strict';
  var httpRequest = new XMLHttpRequest();

  //Cache some elements that will be on the page
  var lightBoxContainerEl = document.getElementById('js-light-box-container');
  var closeEl = document.querySelectorAll('.js-close');
  var lightBoxControlEl = document.querySelectorAll('.js-light-box-control');
  var nextPageEl = document.getElementById('js-next-page');
  var refreshEl = document.getElementById('js-refresh');

  //Old school modules :D
  var App = {

    main: undefined,

    apiUrl: '/api/tags/dogsofinstagram/media/recent',

    imageElementList: [],

    activeIndex: 0,

    cache: {},

    handleRequest: function(){
      var _this = App;
      if (httpRequest.readyState === 4) {
        if (httpRequest.status === 200) {
          var data = JSON.parse(httpRequest.responseText);
          _this.cache = data;
          nextPageEl.dataset.next_url = data.pagination.next_url;
          nextPageEl.disabled = false;
          refreshEl.disabled = false;
          data.data.forEach(function(item, i){
            requestAnimationFrame(function() {
              _this.updateImageElement(_this.imageElementList[i],
                item.images.low_resolution.url, item.images.standard_resolution.url, item.user.username, item.likes.count, item.caption.text, i)
            });
          });
        } else {
          console.log('There was a problem with the request.');
        }
      }
    },

    ajax: function(url){
      httpRequest.onreadystatechange = this.handleRequest;
      httpRequest.open('GET', url);
      httpRequest.send();
    },

    handleCloseLightBox: function(){
      lightBoxContainerEl.classList.remove('active');
    },

    handleHeaderControls: function(e){
      nextPageEl.disabled = true;
      App.ajax(App.apiUrl+'?'+this.dataset.next_url.split('&')[1]);
    },

    handleRefresh: function(e){
      refreshEl.disabled = true;
      App.ajax(App.apiUrl);
    },

    handleChangeLightBoxImage: function(){
      this.dataset ? App.activeIndex = parseInt(this.dataset.index, 10) :  App.activeIndex;
      var imageData =  App.cache.data[App.activeIndex];
      var username = imageData.user.username;
      var lightBoxEl = document.getElementById('js-light-box');
      var usernameEl = document.getElementById('js-light-box-username');
      lightBoxEl.onload = function(){
        lightBoxContainerEl.classList.add('active');
      };
      lightBoxEl.src = imageData.images.standard_resolution.url;
      usernameEl.textContent = username;
      usernameEl.href = 'https://instagram.com/'+username;
      document.getElementById('js-light-box-likes').textContent = '♥ ' + imageData.likes.count;
      document.getElementById('js-light-box-caption').textContent = imageData.caption.text;
    },

    updateImageElement: function(img, thumbnail_src, standard_src, username, likes, caption, index){
      img.src = thumbnail_src;
      img.addEventListener('click', this.handleChangeLightBoxImage);
      img.dataset.index = index;
      img.dataset.large_image = standard_src;
      img.dataset.username = username;
      img.dataset.likes = likes;
      img.dataset.caption = caption;
      return img;
    },

    createImageElements: function(){
      for (var i = 0; i < 20; i++){
        var img = document.createElement('img');
        var div = document.createElement('div');
        div.className = 'thumbnail-container';
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        img.className = 'thumbnail';
        div.appendChild(img)
        this.imageElementList.push(img);
        this.images.appendChild(div);
      }
    },

    handleNextOrPrevious: function(e){
      e.stopPropagation();
      e.preventDefault();
      var control = this.dataset.control;
      switch (App.activeIndex){
        case App.cache.data.length-1:
          control === 'next' ? App.activeIndex = 0 : App.activeIndex = App.activeIndex-1;
          break;
        case 0:
          control === 'prev' ? App.activeIndex =  App.cache.data.length-1 : App.activeIndex = App.activeIndex+1;
          break;
        default:
          control === 'prev' ? App.activeIndex = App.activeIndex-1 : App.activeIndex = App.activeIndex+1;
          break;
      }
      App.handleChangeLightBoxImage();
    },

    init: function(){
      var _this = this;
      this.main = document.getElementById('js-main');
      this.images = document.getElementById('js-images');
      this.createImageElements();
      this.handleRefresh();
      nextPageEl.addEventListener('click', this.handleHeaderControls);
      refreshEl.addEventListener('click', this.handleRefresh);
      [].forEach.call(lightBoxControlEl, function(el) {
        el.addEventListener('click', _this.handleNextOrPrevious);
      });
      [].forEach.call(closeEl, function(el) {
        el.addEventListener('click', _this.handleCloseLightBox);
      });
    }

  };

  App.init();
})();

