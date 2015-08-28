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
  var documentFragment = document.createDocumentFragment();

  //Old school modules :D
  var App = {

    main: undefined,

    apiUrl: '/api/tags/dogsofinstagram/media/recent',

    // Fragile app state  :/
    imageElementList: [],

    activeIndex: 0,

    cache: [],

    imageDataCache: [],

    handleUpdate: function(){
      var _this = App;
      if (httpRequest.readyState === 4) {
        if (httpRequest.status === 200) {
          var data = JSON.parse(httpRequest.responseText);
          _this.cache.push(data);
          nextPageEl.dataset.next_url = data.pagination.next_url;
          nextPageEl.disabled = false;
          refreshEl.disabled = false;
          data.data.forEach(function(item){
            _this.imageDataCache.push(item);
            _this.creatImageElement(
              item.images.low_resolution.url,
              item.images.standard_resolution.url,
              item.user.username,
              item.likes.count,
              item.caption.text,
              _this.imageDataCache.length-1);
          });

          //Batch updates
          requestAnimationFrame(function() {
            _this.images.appendChild(documentFragment);
            documentFragment.innerHTML = '';
          });

        } else {
          console.log('There was a problem with the request.');
        }
      }
    },

    ajax: function(url){
      nextPageEl.disabled = true;
      refreshEl.disabled = true;
      httpRequest.onreadystatechange = this.handleUpdate;
      httpRequest.open('GET', url);
      httpRequest.send();
    },

    handleCloseLightBox: function(){
      lightBoxContainerEl.classList.remove('active');
    },

    handleHeaderControls: function(){
      App.ajax(App.apiUrl+'?'+this.dataset.next_url.split('&')[1]);
    },

    handleRefresh: function(){
      var _this = App;
      [].forEach.call(document.querySelectorAll('.thumbnail-container'), function(el) {
        el.removeEventListener('click', _this.handleChangeLightBoxImage, false);
      });
      _this.imageElementList = [];
      _this.activeIndex = 0;
      _this.cache = [];
      _this.imageDataCache = [];
      _this.images.innerHTML = '';
      App.ajax(App.apiUrl);
    },

    handleChangeLightBoxImage: function(){
      this.dataset ? App.activeIndex = parseInt(this.dataset.index, 10) :  App.activeIndex;
      var imageData = App.imageDataCache[App.activeIndex];
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

    creatImageElement: function(thumbnail_src, standard_src, username, likes, caption, index){
      var img = document.createElement('img');
      var div = document.createElement('div');
      div.className = 'thumbnail-container';
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      img.src = thumbnail_src;
      img.className = 'thumbnail';
      img.addEventListener('click', this.handleChangeLightBoxImage, false);
      img.dataset.index = index;
      img.dataset.large_image = standard_src;
      img.dataset.username = username;
      img.dataset.likes = likes;
      img.dataset.caption = caption;
      div.appendChild(img);
      documentFragment.appendChild(div);
      return img;
    },

    handleNextOrPrevious: function(e){
      switch (this.dataset.control){
        case 'next':
          App.activeIndex = App.activeIndex === App.imageDataCache.length - 1 ? 0 : App.activeIndex + 1;
          break;
        case 'prev':
          App.activeIndex = App.activeIndex === 0 ? App.activeIndex =  App.imageDataCache.length - 1 : App.activeIndex - 1;
          break;
      }
      App.handleChangeLightBoxImage();
    },

    scrolling: false,

    handleWindowScroll: function(){
      App.scrolling = true;
    },

    handleBottomOfPage: function(){
      var bottom = (window.scrollY + window.innerHeight + 100) >= document.body.scrollHeight;
      if (bottom && this.cache.length > 0){
        this.ajax(App.apiUrl+'?'+this.cache[this.cache.length -1].pagination.next_url.split('&')[1]);
      }
    },

    init: function(){
      var _this = this;
      this.main = document.getElementById('js-main');
      this.images = document.getElementById('js-images');
      this.handleRefresh();

      nextPageEl.addEventListener('click', this.handleHeaderControls, false);
      refreshEl.addEventListener('click', this.handleRefresh, false);

      [].forEach.call(lightBoxControlEl, function(el) {
        el.addEventListener('click', _this.handleNextOrPrevious, false);
      });
      [].forEach.call(closeEl, function(el) {
        el.addEventListener('click', _this.handleCloseLightBox, false);
      });

      //Set scrolling/window size to load more images
      window.onscroll = this.handleWindowScroll;
      setInterval(function() {
        if(_this.scrolling) {
          _this.scrolling = false;
          _this.handleBottomOfPage();
        }
        if(window.innerHeight >= document.body.scrollHeight) {
          _this.handleBottomOfPage();
        }
      }, 1000);
    }

  };

  App.init();
})();

