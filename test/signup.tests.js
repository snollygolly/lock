//fails in chrome 28- BrowserStack.
describe('sign up', function () {
  afterEach(function (done) {
    this.auth0.removeAllListeners('transition_mode');
    $('#a0-widget').parents('div').remove();
    global.window.location.hash = '';
    global.window.Auth0 = null;
    setTimeout(done, 1000);
  });

  beforeEach(function () {
    this.auth0 = new Auth0Widget({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
      enableReturnUserExperience: false
    });
  });


  it('should show the loading pane', function (done) {
    var auth0 = this.auth0.show().once('signup_ready', function () {
      $('#a0-signup_easy_email').val('pepo@example.com');
      $('#a0-signup_easy_password').val('123');
      auth0.once('loading_ready', function () {
        expect($('#a0-widget h1').html()).to.be(auth0._dict.t('signup:title'));
        auth0._hideSignIn(function () {
          done();
        });
      });
      bean.fire($('.a0-signup form')[0], 'submit');
    }).once('signin_ready', function () {
      bean.fire($('#a0-widget .a0-sign-up')[0], 'click');
    });
  });

  describe('when server returns error', function () {
    it('should not change to loading', function (done) {
      var auth0 = this.auth0.once('_error', function () {
        expect($('.a0-error').html()).to.be(auth0._dict.t('signup:serverErrorText'));
        done();
      });

      this.auth0.show().once('signin_ready', function () {
        bean.fire($('#a0-widget .a0-sign-up')[0], 'click');
      }).once('signup_ready', function () {
        $('#a0-signup_easy_email').val('pepo@example.com');
        $('#a0-signup_easy_password').val('123');
        bean.fire($('.a0-signup form')[0], 'submit');
      });
    });
  });


  it('should signin with social connection', function (done) {
    this.auth0._auth0.login = function (options) {
      expect(options.connection).to.equal('google-oauth2');
      expect(options.username).to.not.exist;
      done();
    };

    this.auth0.show().on('signin_ready', function (mode) {
      bean.fire($('#a0-widget .a0-sign-up')[0], 'click');
    }).on('signup_ready', function() {
      bean.fire($('.a0-signup span[data-strategy="google-oauth2"]')[0], 'click');
    });
  });

});
