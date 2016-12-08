(function() {
    'use strict';

    angular
        .module('app')
        .controller('ProfileController', ProfileController);

    ProfileController.$inject = ['FirebaseFactory', '$scope', '$state', 'toastr', '$sessionStorage', '$ionicPopover', '$firebaseArray', 'filepickerService', '$window', '$q'];

    /* @ngInject */
    function ProfileController(FirebaseFactory, $scope, $state, toastr, $sessionStorage, $ionicPopover, $firebaseArray, filepickerService, $window, $q) {
        var vm = this;
        vm.title = 'ProfileController';
        vm.logOff = logOff;
        vm.save = save;
        //user from firebase auth
        vm.user = {};
        var uid = $sessionStorage.uid;
        var eventKey = $scope.eventKey;
        vm.deleteEvent = deleteEvent;
        var eventsRef = firebase.database().ref('/events/');
        var eventsRefUsers = firebase.database().ref('/users/' + uid + '/events/');
        vm.eventsArray = $firebaseArray(eventsRef);
        vm.eventsArrayUsers = $firebaseArray(eventsRefUsers);
        var loggedInUser = firebase.auth();
        //for file picker
        $scope.files = JSON.parse($window.localStorage.getItem('files') || '[]');
        $scope.pickFile = pickFile;
        $scope.onSuccess = onSuccess;



        console.log(vm.eventsArrayUsers);
        console.log(uid);


        activate();

        function pickFile() {
            filepickerService.pick({ mimetype: 'image/*' },
                onSuccess
            );
        };

        function onSuccess(Blob) {
            $scope.files = [];
            $scope.files.push(Blob);

            $window.localStorage.setItem('files', JSON.stringify($scope.files));
            $scope.files.url
            console.log($scope.files[0].url);
            firebase.database().ref('/users/' + $sessionStorage.uid).update({ photoURL: $scope.files[0].url });
            vm.user.photoURL = $scope.files[0].url;
            vm.editingPhoto = false;
        };



        FirebaseFactory.returnUserFromDB(uid).then(function(user) {
            vm.user = user;
            console.log(vm.user);

            $ionicPopover.fromTemplateUrl('js/tabs/profile/profile.edit.html', {
                scope: $scope,
            }).then(function(popover) {
                $scope.popover = popover;
            });

            console.log(user);

        })



        function logOff() {

            FirebaseFactory.logOff();
        }

        function save() {

            var userToEdit = angular.copy(vm.user);
            $sessionStorage.searchRadius = userToEdit.radius
            console.log($sessionStorage.searchRadius);
            console.log(userToEdit.radius);
            console.log(userToEdit);

            userToEdit.aboutMe = vm.user.aboutMe;
            console.log(userToEdit);
            vm.DataBaseRefToLoggedInUser = firebase.database().ref('users/' + uid);
            vm.DataBaseRefToLoggedInUser.set(userToEdit);

        }

        function deleteEvent(i, eventKey) {
            swal({
                    title: "Are you sure?",
                    text: "You will not be able to recover this event or it's group members.",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, cancel it!",
                    cancelButtonText: "No, keep my event!",
                    closeOnConfirm: false,
                    closeOnCancel: false
                },
                function(isConfirm) {
                    if (isConfirm) {
                        $q.all([

                            // Promise 1 - Delete from Users array
                            vm.eventsArrayUsers.$loaded().then(
                                // Pass through the name of the Array, without 'vm.'
                                function(eventsArrayUsers) {
                                    // Call the array variable, and then remove... ( $remove() ) it from the array.
                                    // On click, it will remove the index of this object, in the array.
                                    return eventsArrayUsers.$remove(i);
                                }
                            ),

                            // Promise 2 - Deletes the event
                            firebase.database().ref('/events/' + eventKey).remove(),

                            // Promise 3


                        ]).then(function() {
                            swal("Deleted!", "Your event has been canceled.", "success");
                        });
                    } else {
                        swal("Nevermind", "Your event is still on! :)", "error");
                        return;
                    }
                });

        }


        // function deleteEvent2(eventKey) {
        //     
        // }

        // vm.toggleAccordion = function(post) {
        //     post.open = !post.open;
        // };

        // This function is for the accordian

        vm.toggleAccordion = function(post) {
            post.open = !post.open;
        };



        ////////////////

        function activate() {

        }




    }


})();
