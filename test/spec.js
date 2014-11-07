'use strict';

describe('require', function () {
  it('should not throw', function () {
    expect(function () {
      require('bootstrap-webpack!../bootstrap.config.js');
    }).not.to.throw();
  });
});

