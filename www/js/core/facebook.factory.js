(function() {
    'use strict';

    angular
        .module('app')
        .factory('FacebookFactory', FacebookFactory);

    FacebookFactory.$inject = ['$q', '$window'];


    /* @ngInject */
    function FacebookFactory($q, $window) {

    	var FB = $window.FB;

    	if(!FB) throw new Error('Facebook not loaded');

    	FB.init({
    		appId: '336850529998000',
    		// appSecret: 'c9dce132310212a1a5f6296b647ed28c',
    		status: true,
    		cooke: true,
    		xfbml: true,
    		version: 'v2.4'
    	});

        var service = {
            me: me
        };
        return service;

        ////////////////

        function me() {
        }
    }
})();