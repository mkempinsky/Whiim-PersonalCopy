(function() {
    'use strict';

    angular
        .module('app')
        .controller('NotificationsController', NotificationsController);

    NotificationsController.$inject = ['FirebaseFactory', '$scope', '$sessionStorage', 'toastr', '$firebaseObject', '$firebaseArray', '$ionicPopover', '$rootScope'];


    /* @ngInject */
    function NotificationsController(FirebaseFactory, $scope, $sessionStorage, toastr, $firebaseObject, $firebaseArray, $ionicPopover, $rootScope) {
        var vm = this;
        vm.title = 'NotificationsController';
        var uid = $sessionStorage.uid;
        vm.user = {};
        vm.remove = remove;
        vm.add = add;
        var notifsRef = firebase.database().ref('/users/' + uid + '/notifications/');
        var groups = firebase.database().ref('/groups');
        var defaultNumUsers = 2;
        vm.notifications = $firebaseArray(notifsRef);
        var loggedInUser = firebase.auth();

        console.log(uid);

        $scope.setRequestingId = function(id) {
            FirebaseFactory.returnUserFromDB(id).then(function(requestor) {

                $scope.requestor = requestor;
                console.log($scope.requestor);
            })

        }

        function remove(i) {
            vm.notifications.$loaded().then(
                function(notifications) {
                    notifications.$remove(i);
                }
            )
        }



        function add(note, index) {

            $rootScope.$emit('swipeEvent', { event: note.eventKey });



            console.log(note);
            var requestingUserName = note.ownerName;
            var requestingUserId = note.$id;
            var acceptingUserName = $sessionStorage.displayName;
            var acceptingUserId = $sessionStorage.uid;
            
            var title = note.title;
            console.log("acceptingUserId : " + acceptingUserId);
            console.log("requestingUserId : " + requestingUserId);
            var newGroupKey = note.eventKey;

            console.log(note.accepted);
            if(!note.pending) {
                $rootScope.$emit('initiateListeners', { event: note.eventKey });
                remove(index);
            }

            if (note.pending) {

                firebase.database().ref('users/')


                FirebaseFactory.userExistsInGroups(requestingUserId, newGroupKey).then(
                        function(exists) {
                            if (exists) {
                                toastr.error('You are already a member of this group');
                                remove(index); //////////////////////////////////////////////////////////

                            } else {
                                toastr.success('Should execute the rest of the code.');
                                var newChatObj = {
                                    lastMessage: "",
                                    numberOfUsers: defaultNumUsers,
                                    timeStamp: Date.now(),
                                    title: title
                                };

                                var requestingUser = { name: requestingUserName };
                                var acceptingUser = { name: acceptingUserName };

                                var newGroupKey = note.eventKey;
                                console.log(newGroupKey);
                                //all updates put in this array
                                var updates = {};

                                FirebaseFactory.eventExistInOwnerEvents(acceptingUserId, newGroupKey).then(
                                        function(exists) {
                                            console.log(' group key ====> '+ newGroupKey);
                                            if (exists) {
                                                console.log('added user to existing database');
                                                updates['users/' + requestingUserId + '/groups/' + newGroupKey] = { title: title, key: newGroupKey };
                                                updates['groups/users/' + newGroupKey + '/' + requestingUserId] = { name: requestingUserName };
                                                updates['/events/' + newGroupKey + '/members/' + requestingUserId] = { isMember: true};

                                            } else { // end if exists
                                                console.log('created new database');
                                                // add whole group tree 

                                                updates['/events/' + newGroupKey + '/members/' + requestingUserId] = { isMember: true};
                                                
                                                updates['/groups/chats/' + newGroupKey] = newChatObj;

                                                updates['groups/users/' + newGroupKey + '/' + requestingUserId] = { name: requestingUserName };
                                                updates['groups/users/' + newGroupKey + '/' + acceptingUserId] = { name: acceptingUserName };

                                                updates['users/' + requestingUserId + '/groups/' + newGroupKey] = { title: title, key: newGroupKey };
                                                updates['users/' + acceptingUserId + '/groups/' + newGroupKey] = { title: title, key: newGroupKey };
                                            } // end else

                                            firebase.database().ref().update(updates).then(
                                                function() {
                                                    toastr.success("You can now chat with " + requestingUserName + ".");
                                                    remove(index);
                                                },
                                                function() {
                                                    toastr.error("There was a problem adding this info to our database.")
                                                }
                                            )
                                    // goes in push below { message: 'test', timeStamp: Date.now(), readBy: {user: 'true'} }
                                     firebase.database().ref('/groups/messages/' + newGroupKey).push();
                                    
                                     var notification = {
                                        "active": true,
                                        "timeStamp": Date.now(),
                                        "ownerName": $sessionStorage.displayName,
                                        "title": 'accepted your request for ' + note.title,
                                        "photoURL": $sessionStorage.photoURL,
                                        "pending": false
                                        }


                                        var notifRef = firebase.database().ref('/users/' + requestingUserId + '/notifications/' + acceptingUserId );
                                        console.log(notification);

                                                   
                                        notifRef.set(notification);

                                        setTimeout(function() {
                                             $rootScope.$emit('initiateListeners', { event: note.eventKey });
                                        }, 7000)

                                        

                      } // end callback
        ) //end then

                } // end else
            }
        ) // end userExistsInGroups

    } //end if note note accepted


    
} // end add function




        $ionicPopover.fromTemplateUrl('js/tabs/notifications/notifications.popover.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.popover = popover;
        });

        $scope.closePopover = function($event) {
            $scope.popover.hide();
        };






    }
})();
