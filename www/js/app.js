(function() {
    'use strict';

    angular
        .module('app', [
            'ionic', 'ui.router', 'firebase', 'toastr', 'ngStorage', 'ionic.contrib.ui.tinderCards', 'angular-filepicker'
        ])
        .config(function appConfig($urlRouterProvider, $stateProvider, fileStackApiKey, filepickerProvider) {

            filepickerProvider.setKey(fileStackApiKey);

            // Ionic uses AngularUI Router which uses the concept of states
            // Learn more here: https://github.com/angular-ui/ui-router
            // Set up the various states which the app can be in.
            // Each state's controller can be found in it's feature folder

            $urlRouterProvider.otherwise('/login');

            $stateProvider
                .state('login', {
                    url: '/login',
                    templateUrl: 'js/login/defaultLogin.html',
                    controller: 'DefaultLoginController as login'
                })

            // .state('chat', {
            //     url: '/chat',
            //     templateUrl: 'js/tabs/chat/chat.html',
            //     controller: 'ChatController as chat'
            // })



            .state('tabs', {
                url: '/tabs',
                templateUrl: 'js/tabs/tabs.html',
                abstract: true,
                controller: 'TabsController'

            })

            .state('tabs.chatrooms', {
                url: '/chatrooms',
                views: {
                    'chatrooms': {
                        templateUrl: 'js/tabs/chat/chat.groups.html',
                        controller: 'ChatController as chatCtrl'
                    }
                }
            })

            .state('tabs.chat', {
                url: '/chat',
                views: {
                    'chatrooms': {
                        templateUrl: 'js/tabs/chat/chat.feed.html',
                        controller: 'ChatController as chatCtrl'
                    }
                }
            })

            .state('tabs.dashboard', {
                url: '/dashboard',
                views: {
                    'dashboard': {
                        templateUrl: 'js/tabs/dashboard/dashboard.html',
                        controller: 'DashboardController as dashboard'
                    }
                }
            })

            .state('tabs.create', {
                url: '/create',
                views: {
                    'create': {
                        templateUrl: 'js/tabs/create/create.html',
                        controller: 'CreateController as create'
                    }
                }
            })


            .state('tabs.profile', {
                url: '/profile',
                views: {
                    'profile': {
                        templateUrl: 'js/tabs/profile/profile.html',
                        controller: 'ProfileController as profileCtrl'
                    }
                }
            })

            .state('tabs.notifications', {
                url: '/notifications',
                views: {
                    'notifications': {
                        templateUrl: 'js/tabs/notifications/notifications.html',
                        controller: 'NotificationsController as notifs'
                    }
                }
            });

        })

    .controller('TabsController', function($scope, $rootScope, FirebaseFactory, $firebaseArray, toastr, $sessionStorage, $firebaseObject, $state, $q) {
        //listen to event fired when user logs in
        var usersGroupKeys = [];
        var usersGroupsFirebaseRefs = [];

        // get keys to of any groups user is a member
        var usersGroupRefs = FirebaseFactory.getUserGroupRefs($sessionStorage.usersGroupKeys);

        function getAllMessages() {
            var defer = $q.defer()
            var promises = [];
            // get reference to any message group user belongs to
            usersGroupRefs = FirebaseFactory.getUserGroupRefs($sessionStorage.usersGroupKeys);
            usersGroupRefs.forEach(function(ref) {
                promises.push(FirebaseFactory.returnContentsFromRef(ref));
            });

            $q.all(promises).then(function(values) {
                console.log('display values from getAllMessages promise queue return');
                console.log(values);
                defer.resolve(values);
            });
            return defer.promise;
        } //end getAllMessages

        function countUnreadMessages(multipleArrays) {
            var count = 0;
            multipleArrays.forEach(function(messageArray) {

                messageArray.forEach(function(message) {


                    var userIDSinReadBy = Object.keys(message.readBy);
                    var userReadMessage = false;
                    userIDSinReadBy.forEach(function(id) {

                        if (id === $sessionStorage.uid) {

                            userReadMessage = true;
                        }
                    }); // end loop through readBy
                    console.log('increment count : ' + userReadMessage);
                    if (!userReadMessage) {
                        count += 1;
                        console.log(count);
                    }
                }); //end loop through messages
            });
            return count;
        }




        //3 way bound to hasNewMessage boolean under users table
        var hasNewMessage = $firebaseObject(firebase.database().ref('/users/' + $sessionStorage.uid + '/hasNewMessage'));
        hasNewMessage.$bindTo($scope, 'hasNewMessage');

        //get notifications count. will display in badge on tab. executes on load
        var notificationsRef = firebase.database().ref('/users/' + $sessionStorage.uid + '/notifications/');
        $scope.notifications = $firebaseArray(notificationsRef);
        $scope.notifications.$loaded().then(function(notifications) {
            $scope.notificationsCount = { num: notifications.length };
        });

        //get notifications count. will display in badge on tab. executes on child added
        notificationsRef.limitToLast(1).on('child_added', function(data) {
            $scope.notifications.$loaded().then(function(notifications) {
                $scope.notificationsCount = { num: notifications.length };
            });
        });

        //get notifications count. will display in badge on tab. executes on child removed
        notificationsRef.on('child_removed', function(data) {
            $scope.notifications.$loaded().then(function(notifications) {
                $scope.notificationsCount = { num: notifications.length };
            });
        });

        function setEventListenersOnGroupsMessages() {
            console.log('<--------------------------------------------------------------------Checking for Messages------------------------------------------------------------------>"')
            var defer = $q.defer();

            // gets firebase references to all message nodes
            usersGroupRefs = FirebaseFactory.getUserGroupRefs($sessionStorage.usersGroupKeys);
            

            //reference to users groups
            var groupsRef = firebase.database().ref('/users/' + $sessionStorage.uid + '/groups').once('value', function(snapshot) {
                // if user has group complete the rest of the code
                if (snapshot.val() === null) {
                    console.log('something wrong with ref to users/groups');
                } else {
                    var usersGroups = snapshot.val();
                    var usersGroupKeys = Object.keys(usersGroups);
                        
                  
                  

                    usersGroupKeys.forEach(

                        function(k) {
                            


                            //re-count messages when updates happen on message nodes
                            firebase.database().ref('/groups/messages/' + k).on('child_changed', function() {
                                //Check for unread message count if usersGroupRefs aren't null

                               
                                if (usersGroupRefs !== null) {
                                    
                                    getAllMessages().then(function(results) {
                                        
                                        $scope.unreadCount = countUnreadMessages(results);

                                    })
                                }
                            })

                            firebase.database().ref('/groups/messages/' + k).on('child_added', function(data) {

                                // firebase.database().ref('/users/' + $sessionStorage.uid).update({ hasNewMessage: true});

                                // // get message status for each group in users. mark groups where new message with hasNewChatEntry as true;
                                FirebaseFactory.getNewMessageStatus($sessionStorage.uid);
                                //Check for unread message count if usersGroupRefs aren't null
                                if (usersGroupRefs !== null) {
                                    getAllMessages().then(function(results) {
                                        $scope.unreadCount = countUnreadMessages(results);
                                        if ($scope.unreadCount > 0) {
                                            
                                        } 
                                    });
                                }
                            });
                        }
                    )
                    defer.resolve('promise finished');
                }
            });
            return defer.promise;
        }

        $rootScope.$on('initiateListeners', function(event, data) {
           

                //ref to user's groups            
                var ref = firebase.database().ref('/users/' + $sessionStorage.uid + '/groups');

                // this will reset $sessionStorage.usersGroupKeys needed to check new message nodes
                 
                FirebaseFactory.getKeysFromFireRef(ref).then(
                    function(keys) {
                        //////////////////////////////////////////////////////////////////
                         setEventListenersOnGroupsMessages().then(
                            function(result) {
                                console.log('setEventListenersOnGroupsMessages executes on initiateListeners');
                            },
                            function(error) {
                                console.log('error after setEventListenersOnGroupsMessages')
                            }
                        );

                    }
                )

            

            
           
        })

        setEventListenersOnGroupsMessages().then(
            function(result) {
                console.log('setEventListenersOnGroupsMessages finished');
            },
            function(error) {
                console.log('error after setEventListenersOnGroupsMessages')
            }
        );

        $scope.initiateChat = function() {
            $scope.hasNewMessage = false;
            console.log($scope.hasNewMessage);

            setEventListenersOnGroupsMessages().then(
                function(result) {
                    console.log('setEventListenersOnGroupsMessages finished, next state.go tabs.chatrooms');
                    $state.go('tabs.chatrooms');
                },
                function(error) {
                    console.log('error after setEventListenersOnGroupsMessages')
                }
            );
        }
    })

    .run(function appRun($ionicPlatform) {
        $ionicPlatform.ready(function() {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                // Don't remove this line unless you know what you are doing. It stops the viewport
                // from snapping when text inputs are focused. Ionic handles this internally for
                // a much nicer keyboard experience.
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        })
    })




})();
