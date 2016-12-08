(function() {
    'use strict';

    angular
        .module('app')
        .controller('ChatController', ChatController);

    ChatController.$inject = ['FirebaseFactory', '$scope', '$sessionStorage', 'toastr', '$firebaseObject', '$firebaseArray', '$ionicPopover', '$ionicModal'];

    /* @ngInject */
    function ChatController(FirebaseFactory, $scope, $sessionStorage, toastr, $firebaseObject, $firebaseArray, $ionicPopover, $ionicModal) {
        var vm = this;
        vm.title = 'ChatController';
        var chatroomsRef = firebase.database().ref('/users/' + $sessionStorage.uid + '/groups');
        var senderId = firebase.database().ref('/groups/messages/');
        vm.chatrooms = $firebaseArray(chatroomsRef);
        vm.currentChat = {};
        $scope.numberMessagesToShow = 5;
        var groupMessagesRef = {};
        $scope.uid = $sessionStorage.uid;


        vm.chatrooms.$loaded(function(chatrooms) {
            if (chatrooms.length < 1) {
                 swal("Um...", "No friends? Go to the dash and make some!", "warning");
            }
        });
        

        

        var wholeGroupRepresentation = [];
        $scope.test = 'This is a test bitches!'
        
        var room = {};
        activate();

        function getTotalMessageCount(ref) {
            $firebaseArray(ref).$loaded(
                function(messages) {
                    $scope.totalMessageCount = messages.length;
                    console.log($scope.totalMessageCount )
                }
            )
        }

        $scope.openChat = function(thisChat) {
            vm.currentChat = thisChat;
            var groupId = thisChat.$id;
            console.log(groupId);
            groupMessagesRef = firebase.database().ref('/groups/messages/' + groupId);

            getTotalMessageCount(groupMessagesRef);


            

            room = $firebaseObject(firebase.database().ref('/groups/chats/' + groupId));
            $scope.messages = $firebaseArray(groupMessagesRef.limitToLast($scope.numberMessagesToShow));
            $scope.users = $firebaseArray(firebase.database().ref('/groups/users/' + groupId));

            console.log($scope.messages);

            FirebaseFactory.markMessagesAsRead(groupMessagesRef, groupId);

            room.$loaded().then(
                function(room) {
                    $scope.roomTitle = room.title;
                    console.log(room);
                }
            )
            thisChat.hasNewChatEntry = false;
            console.log(thisChat);

            var usersGroupRef = firebase.database().ref('/users/'  + $sessionStorage.uid + '/groups/' + groupId );

            // hack: set timeStamp on last message to now to prevent it from triggering newMessage behavior
            usersGroupRef.update({hasNewChatEntry: false, timeOfLastMessage: Date.now()});


            console.log( vm.chatrooms);
            
        }

         $scope.changeNumberDisplayed = function(increment) {
            
            $scope.numberMessagesToShow += increment;
            
           
            $scope.messages = $firebaseArray(groupMessagesRef.limitToLast($scope.numberMessagesToShow));
            
        }

        function sentByLoggedInUser() {

        }


        $scope.sendMessage = function(message) {

          
          var newMessage = angular.copy(message);

          getTotalMessageCount(groupMessagesRef);


            var newMessageObj = {
                message: newMessage,
                timeStamp: Date.now(),
                sentBy: $sessionStorage.displayName,
                sentByID: $sessionStorage.uid,
                photoURL: $sessionStorage.photoURL,
                readBy: { user: true}

            }

            console.log(newMessageObj);

             $scope.messages.$add(newMessageObj).then(
              function(ref) {
                console.log(ref);
                ref.once('value', function(snapshot) {
                   console.log(snapshot.val());
                })
                ref.child('readBy').once('value', function(readBy) {
                    console.log(readBy.val());
                })
                ref.child('readBy/' + $sessionStorage.uid).set({read: true});
              }
              // firebase.database().ref('/groups/messages/' + groupId + '/' + k + '/readBy/' + $sessionStorage.uid).update({read: true});
            )

                
            firebase.database().ref('/users/' + $sessionStorage.uid + '/groups/' + vm.currentChat.$id).update({timeOfLastMessage: Date.now()});

                
          


        }

        $ionicPopover.fromTemplateUrl('js/tabs/chat/chat.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.popover = popover;
        });

        function activate() {
            console.log("activate running");
           firebase.database().ref('/users/' + $sessionStorage.uid + '/groups').once('value', function(snapshot) {
                    if(snapshot.val() === null) {
                        console.log('something wrong with ref to users/groups');
                    } else {

                        
                        


                        var usersGroups = snapshot.val();
                        var usersGroupKeys =  Object.keys(usersGroups)

                        usersGroupKeys.forEach(function(k) {
                            console.log(k)
                        })
                        
                        usersGroupKeys.forEach(
                            function(k) {
                                console.log(k);
                                firebase.database().ref('/groups/messages/' + k).limitToLast(1).on('child_added', function(data) {
                                    console.log('ON CHILD ADDED TO GROUPS/MESSAGES/K FIRED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                                    firebase.database().ref('/users/' + $sessionStorage.uid).update({ hasNewMessage: true});
                                    // get message status for each group in users. mark groups where new message with hasNewChatEntry as true;
                                    FirebaseFactory.getNewMessageStatus($sessionStorage.uid).then(
                                    function(result) {
                                        console.log(result);
                                    },
                                    function(error) {
                                        console.log(error);
                                    }
                                )
                                    
                               
                                    
                                });
                            }
                        )

                    }
                }); 
            

            // FirebaseFactory.getNewMessageStatus($sessionStorage.uid).then(
            //     function(result) {
            //         console.log(result);
            //     },
            //     function(error) {
            //         console.log(error);
            //     }
            // )
          
        }


        $ionicModal.fromTemplateUrl('js/tabs/chat/chat.feed.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function() {
            $scope.modal.show();
        };
        $scope.closeModal = function() {
            $scope.modal.hide();
        };
        // Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hidden', function() {
            // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function() {
            // Execute action
        });

    }
})();