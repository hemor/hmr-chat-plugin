(function($) {
  $.fn.hmrChat = function(options) {
    var settings = $.extend({
      title: 'HMR Chat Plugin'
    }, options);

    var fbAuth = firebase.auth();
    var fbDb = firebase.firestore();

    var usersCollection = fbDb.collection('users');
    var conversationsCollection = fbDb.collection('conversations');

    var hmrAllPages = [];
    var conversationId = null;
    var conversationUser = null;

    var $chatboxWindow = null;


    function _init() {
      // Render the needed html elements
      _render();

      _showLoading();

      var $hmrLoginRegisterPage = $('#hmr-login-register-page');
      var $hmrRegisterPage = $('#hmr-register-page');
      var $hmrLoginPage = $('#hmr-login-page');
      var $hmrUserListPage = $('#hmr-user-list-page');
      var $hmrUserConversationPage = $('#hmr-user-conversation-page');

      hmrAllPages = [$hmrLoginRegisterPage, $hmrRegisterPage, $hmrLoginPage, $hmrUserListPage, $hmrUserConversationPage];

      var $hmrRegisterButton = $('#hmr-register-btn');
      var $hmrLoginButton = $('#hmr-login-btn');
      var $hmrSubHeadingBackButton = $('#hmr-chatbox-subheading-back-btn');
      var $hmrSubHeadingLogoutButton = $('#hmr-chatbox-subheading-logout-btn');
      var $hmrReplyButton = $('#hmr-chatbox-reply-btn');

      hmrShowPage(''); // Initially hide all

      fbAuth
        .onAuthStateChanged(function(user) {
          if (user) {
            hmrShowPage('hmr-user-list-page', { heading: true, title: user.displayName, showLogout: true, showBack: false });
          }
          else {
            hmrShowPage($hmrLoginRegisterPage);
          }
        });

      $('.hmr-min-max-icon').on('click', function() {
        hmrToggleChatWindow();
      });

      $hmrRegisterButton.on('click', function() {
        hmrShowPage($hmrRegisterPage, { heading: true, title: 'REGISTER', showLogout: false, showBack: true });
      });

      $hmrLoginButton.on('click', function() {
        hmrShowPage($hmrLoginPage, { heading: true, title: 'LOGIN', showLogout: false, showBack: true });
      });

      $hmrSubHeadingBackButton.on('click', function() {
        hmrNavigateBack();
      });

      $hmrSubHeadingLogoutButton.on('click', function() {
        hmrFbLogout();
      });

      $($hmrRegisterPage.children('form')).on('submit', function(e) {
        hmrHandleRegister(e);
      });

      $($hmrLoginPage.children('form')).on('submit', function(e) {
        hmrHandleLogin(e);
      });

      $hmrReplyButton.on('click', function(e) {
        hmrHandleChatMessageSubmit(e);
      });

      $('.hmr-chatbox-reply').find('input[name=message]').on('keypress', function(e) {
        if (e.which === 13) {
          hmrHandleChatMessageSubmit(e);
        }
      });

      hmrGetUsers();
    }

    function _render() {
      $chatboxWindow = $(`<div class="row hmr-chatbox-window col-xs-5 col-md-3 hmr-pr-0 hmr-pl-0">
        <div class="col-xs-12 hmr-pr-0 hmr-pl-0">
          <div class="panel panel-default hmr-chatbox-header hmr-mb-0">
            <div class="panel-heading row hmr-mr-0 hmr-ml-0">
              <div class="col-xs-10">
                <div class="panel-title">
                    ${settings.title}
                </div>
              </div>
              <div class="col-xs-1">
                  <span class="glyphicon glyphicon-chevron-down hmr-min-max-icon hmr-button-icon"></span>
              </div>
            </div>
          </div>
          <div class="panel-body hmr-chatbox-body">
            <div class="hmr-chatbox-subheading">
              <div class="row hmr-ml-0 hmr-mr-0">
                <div class="col-xs-1">
                  <span id="hmr-chatbox-subheading-back-btn" class="glyphicon glyphicon-arrow-left hmr-button-icon"></span>
                </div>
                <div id="hmr-chatbox-subheading-title" class="col-xs-9">
                  Firstname Lastname
                </div>
                <div class="col-xs-1">
                  <span id="hmr-chatbox-subheading-logout-btn" class="glyphicon glyphicon-log-out hmr-button-icon"></span>
                </div>
              </div>
            </div>
            <div class="container hmr-pl-0">
              <div class="hmr-chatbox-main-content">
                <div id="hmr-login-register-page">
                  <div class="btn-toolbar">
                    <button id="hmr-register-btn" class="btn btn-primary text-uppercase">Register</button>
                    <button id="hmr-login-btn" class="btn btn-primary text-uppercase">Login</button>
                  </div>
                </div>
                <div id="hmr-register-page">
                  <form>
                    <div class="form-group">
                      <label>Firstname*</label>
                      <input type="text" class="form-control" name="firstname" required>
                    </div>
                    <div class="form-group">
                      <label>Lastname*</label>
                      <input type="text" class="form-control" name="lastname" required>
                    </div>
                    <div class="form-group">
                      <label>Email*</label>
                      <input type="email" class="form-control" name="email" required>
                    </div>
                    <div class="form-group">
                      <label>Password*</label>
                      <input type="password" class="form-control" name="password" required>
                    </div>
                    <div class="form-group">
                      <label>Confirm Password*</label>
                      <input type="password" class="form-control" name="confirm-password" required>
                    </div>
                    <div class="form-group">
                      <button type="submit" class="btn btn-primary pull-right">Submit</button>
                    </div>
                  </form>
                </div>
                <div id="hmr-login-page">
                  <form>
                    <div class="form-group">
                      <label>Email*</label>
                      <input type="email" class="form-control" name="email" required>
                    </div>
                    <div class="form-group">
                      <label>Password*</label>
                      <input type="password" class="form-control" name="password" required>
                    </div>
                    <div class="form-group">
                      <button type="submit" class="btn btn-primary pull-right">Submit</button>
                    </div>
                  </form>
                </div>
                <div id="hmr-user-list-page"></div>
                <div id="hmr-user-conversation-page" class="hmr-ma-n-7">
                  <div class="hmr-user-conversation">
                    <div class="row hmr-message"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="row hmr-chatbox-reply">
              <div class="col-xs-12 hmr-pl-0">
                <div class="input-group">
                  <input type="text" name="message" class="form-control input-sm" placeholder="Write your message here..." />
                  <span class="input-group-btn">
                    <button class="btn btn-primary btn-sm" id="hmr-chatbox-reply-btn">Send</button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="hmr-loading-modal"></div>
      </div>`);

      $chatboxWindow.appendTo(_container);
    }

    function _showLoading() {
        var $sheet = $("#__custom"), cssText = `.hmr-loading-modal:before { width: ${$chatboxWindow.innerWidth() - 15}px !important; height: ${$chatboxWindow.innerHeight()}px !important;}`;//for a fixed position on :before, width,height of 100% will only be relative to that of the body element, hence using the chatbox size to determine the overlay size
        $sheet.length ? $sheet.html(cssText) : $('<style id="__custom" />').html(cssText).appendTo("head");//did a css Overide on the pseudo:before, since it is not a dom element, no jquery Api can modify d style
        $chatboxWindow.addClass('hmr-loading');
    }

    function _hideLoading() {
      $chatboxWindow.removeClass('hmr-loading');
    }

    function hmrGetUsers() {
      _showLoading();

      usersCollection
        .orderBy('displayName')
        .onSnapshot(function(snapshot) {
          var currentPageId = hmrGetCurrentPage();
    
          if (currentPageId === 'hmr-user-list-page') {
            var users = {};
            snapshot
              .forEach(function(doc) {
                users[doc.id] = doc.data();
              });
    
            hmrDisplayUserList(users);
          }

          _hideLoading();
      });
    }
    
    function hmrDisplayUserList(users) {
      $('#hmr-user-list-page').find('.hmr-user-list').remove();
    
      $.each(users, function(key, user) {
        if (user.authId !== fbAuth.currentUser.uid) {
          $userItem = $(`<div data-id="${key}" class="row hmr-user-list">
            <div class="row hmr-user-list-body">
              <div class="col-xs-3 hmr-user-list-avatar">
                <div class="hmr-user-list-avatar-icon">
                  <img src="https://bootdey.com/img/Content/avatar/avatar1.png">
                </div>
              </div>
              <div class="col-xs-9 hmr-user-list-main">
                <div class="row">
                  <div class="col-xs-12 hmr-user-list-main-name">
                    <span class="hmr-user-list-main-name-meta">${user.displayName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>`);

          $userItem.click(function(e) {
            hmrHandleUserListClick(e);
          });

          $userItem.appendTo('#hmr-user-list-page');
        }
      });
    }
    
    function hmrToggleChatWindow() {
      var $icon = $('.hmr-min-max-icon');
      var $chatBody = $('.hmr-chatbox-body');
      if ($icon.hasClass('glyphicon-chevron-up')) {
        // Maximize
        $icon.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
        $chatBody.show();
      }
      else if ($icon.hasClass('glyphicon-chevron-down')) {
        // Minimize
        $icon.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
        $chatBody.hide();
      }
    }
    
    function hmrShowPage(page, options = {}) {
      if (typeof page === 'string' && page) {
        page = $('#' + page);
      }
    
      var $subHeading = $('.hmr-chatbox-subheading');
      var $subHeadingTitle = $('#hmr-chatbox-subheading-title');
      var $subHeadingLogout = $('#hmr-chatbox-subheading-logout-btn');
      var $subHeadingBack = $('#hmr-chatbox-subheading-back-btn');
      var $chatReply = $('.hmr-chatbox-reply');
    
      if (typeof options === 'object') {
        if (('heading' in options) && (options.heading === true)) {
          if ('title' in options) {
            $subHeadingTitle.text(options.title);
          }
          else {
            $subHeadingTitle.text('');
          }
    
          if (('showLogout' in options) && (options.showLogout === true)) {
            $subHeadingLogout.closest('div').show();
          }
          else {
            $subHeadingLogout.closest('div').hide();
          }
    
          if (('showBack' in options) && (options.showBack === false)) {
            $subHeadingBack.closest('div').hide();
          }
          else {
            $subHeadingBack.closest('div').show();
          }
    
          if (('reply' in options) && (options.reply === true)) {
            $chatReply.show();
          }
          else {
            $chatReply.hide();
          }
    
          $subHeading.show();
        }
        else {
          $subHeading.hide();
          $chatReply.hide();
        }
      }
    
      hmrAllPages.forEach(function(_page) {
        if (_page.is(page)) {
          _page.show();
        }
        else {
          _page.hide();
        }
    
        if (_page.is($('#hmr-user-list-page'))) {
          _showLoading();
          hmrGetUsers();
        }
      });
    }
    
    function hmrNavigateBack() {
      var currentPageId = hmrGetCurrentPage();
      if (currentPageId === 'hmr-register-page' || currentPageId === 'hmr-login-page') {
        // Show hmr-login-register-page
        hmrShowPage('hmr-login-register-page');
      }
      else if (currentPageId === 'hmr-user-conversation-page') {
        // Show hmr-user-list-page
        hmrShowPage('hmr-user-list-page', { heading: true, title: fbAuth.currentUser.displayName, showLogout: true, showBack: false });
      }
    }
    
    function hmrGetCurrentPage() {
      var $hmrMainContent = $('.hmr-chatbox-main-content');
      var currentPage = $hmrMainContent.children(':visible')[0];
      var currentPageId = $(currentPage).attr('id');
    
      return currentPageId;
    }
    
    function hmrHandleRegister(e) {
      e.preventDefault();
      var $form = $(e.target);
    
      var firstname = $form.find('input[name=firstname]').val();
      var lastname = $form.find('input[name=lastname]').val();
      var email = $form.find('input[name=email]').val();
      var password = $form.find('input[name=password]').val();
      var confirmPassword = $form.find('input[name=confirm-password]').val();
    
      if (password !== confirmPassword) {
        alert('Passwords do not match');
      }
      else {
        $form.trigger('reset');
        var displayName = firstname + ' ' + lastname;
        hmrFbRegister(email, password, displayName);
      }
    }
    
    function hmrHandleLogin(e) {
      e.preventDefault();
      var $form = $(e.target);
    
      var email = $form.find('input[name=email]').val();
      var password = $form.find('input[name=password]').val();
    
      $form.trigger('reset');
    
      hmrFbLogin(email, password);
    }
    
    function hmrFbRegister(email, password, displayName) {
      _showLoading();

      fbAuth
        .createUserWithEmailAndPassword(email, password)
        .then(function(user) {
          user.updateProfile({
            displayName: displayName
          })
          .then(function() {
            return usersCollection.add({
              displayName: user.displayName,
              email: user.email,
              authId: user.uid
            });
          })
          .then(function(doc) {
            hmrShowPage('hmr-user-list-page', { heading: true, title: displayName, showLogout: true, showBack: false });
            _hideLoading();
          })
          .catch(function(error) {
            alert(error.message);
            _hideLoading();
          });
        })
        .catch(function(error) {
          alert(error.message);
          _hideLoading();
        });
    }
    
    function hmrFbLogin(email, password) {
      _showLoading();

      fbAuth
        .signInWithEmailAndPassword(email, password)
        .then(function(user) {
          hmrShowPage('hmr-user-list-page', { heading: true, title: user.displayName, showLogout: true, showBack: false });
          _hideLoading();
        })
        .catch(function(error) {
          alert(error.message);
          _hideLoading();
        });
    }
    
    function hmrFbLogout() {
      _showLoading();

      fbAuth
        .signOut()
        .then(function() {
          _hideLoading();
          hmrShowPage('hmr-login-register-page');
        })
        .catch(function(error) {
          alert(error.message);
          _hideLoading();
        });
    }
    
    function hmrHandleUserListClick(e) {
      _showLoading();

      var id = $(e.currentTarget).data('id');
    
      usersCollection
        .doc(id)
        .get()
        .then(doc => {
          conversationUser = doc.data();  
          hmrDisplayConversationPage();
          _hideLoading();
        });
    }
    
    function hmrDisplayConversationPage() {
      _showLoading();

      conversationsCollection
        .where(`users.${fbAuth.currentUser.uid}`, '==', true)
        .where(`users.${conversationUser.authId}`, '==', true)
        .limit(1)
        .get()
        .then(snapshot => {
          if (snapshot.docs[0]) {
            conversationId = snapshot.docs[0].id;
          }
          else {
            conversationId = null;
          }
          hmrShowPage('hmr-user-conversation-page', { heading: true, title: conversationUser.displayName, showLogout: true, showBack: true, reply: true });
          hmrGetConversationMessages();
        });
    }
    
    function hmrGetConversationMessages() {
      if (!conversationId) {
        hmrDisplayConversationMessages([]);
      }
      else {
        conversationsCollection
        .doc(conversationId)
        .collection('messages')
        .orderBy('date')
        .onSnapshot(function(snapshot) {
          var currentPageId = hmrGetCurrentPage();
      
          if (currentPageId === 'hmr-user-conversation-page') {
            var messages = [];
            snapshot
              .forEach(function(doc) {
                messages.push(doc.data());
              });
      
              hmrDisplayConversationMessages(messages);
          }
        });
      }
    }
    
    function hmrDisplayConversationMessages(messages) {
      _hideLoading();

      var $messageList = $('.hmr-message');
      $messageList.html('');
    
      var formatDate = function(dateLong) {
        var d = new Date(dateLong);
        var day = ("00" + d.getDate()).slice(-2);
        var month = ("00" + d.getMonth()).slice(-2);
        var year = d.getFullYear();
        var hour = ("00" + d.getHours()).slice(-2);
        var min = ("00" + d.getMinutes()).slice(-2);
        var sec = ("00" + d.getSeconds()).slice(-2);
        
        return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
      }
    
      messages.forEach(function(message) {
        if (message.sender === fbAuth.currentUser.uid) {
          // Sender
          $(`<div class="row hmr-message-body">
            <div class="col-xs-12 hmr-message-main-sender">
              <div class="hmr-message-sender">
                <div class="hmr-message-text">${message.text}</div>
                <span class="hmr-message-time pull-right">${formatDate(message.date)}</span>
              </div>
            </div>
          </div>`).appendTo($messageList);
        }
        else {
          // Receiver
          $(`<div class="row hmr-message-body">
            <div class="col-xs-12 hmr-message-main-receiver">
              <div class="hmr-message-receiver">
                <div class="hmr-message-text">${message.text}</div>
                <span class="hmr-message-time pull-right">${formatDate(message.date)}</span>
              </div>
            </div>
          </div>`).appendTo($messageList);
        }
      });
    
      // Automatically scroll down
      $('.hmr-chatbox-main-content').scrollTop(function() { return this.scrollHeight; });
    }
    
    function hmrHandleChatMessageSubmit(e) {
      _showLoading();

      var $messageInput = $(e.target).closest('.input-group').find('input[name=message]');
      var message = $messageInput.val();
      $messageInput.val('');
    
      var sendMessage = function() {
        var data = {
          sender: fbAuth.currentUser.uid,
          text: message,
          date: Date.now()
        };
      
        conversationsCollection
          .doc(conversationId)
          .collection('messages')
          .add(data)
          .then(() => hmrGetConversationMessages());
      }
    
      if (!conversationId) {
        var data = {
          users: {}
        };
        data.users[fbAuth.currentUser.uid] = true;
        data.users[conversationUser.authId] = true;
    
        conversationsCollection
          .add(data)
          .then(doc => {
            conversationId = doc.id;
            sendMessage();
          });
      }
      else {
        sendMessage();
      }
    }

    // If the plugin is used on multiple elements on the page, use only the first one
    var _container = this.first();
    _init();
  }
})(jQuery);