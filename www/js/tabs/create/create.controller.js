(function() {
    'use strict';

    angular
        .module('app')
        .controller('CreateController', CreateController);

    CreateController.$inject = ['FirebaseFactory', '$stateParams', '$state', '$scope', '$ionicPopover', '$sessionStorage', 'toastr', 'GeolocationFactory'];

    /* @ngInject */
    function CreateController(FirebaseFactory, $stateParams, $state, $scope, $ionicPopover, $sessionStorage, toastr, GeolocationFactory) {
        var vm = this;
        vm.title = 'CreateController';
        vm.createEvent = createEvent;
        vm.category = '';
        vm.uid = $sessionStorage.uid; 
        $scope.newEvent = {};
        var userInfo = {};

        activate();


        function createEvent() {

            if ( $scope.newEvent.name == null ){

                    swal("Oops", "You need to enter a name for your event!", "error");

                } else if ($scope.newEvent.description == null){

                    swal("Oops", "You need to enter a description for your event!", "error");

                } else if ($scope.newEvent.requiredUsers == null){

                    swal("Oops", "You need to say how many people you'd like to join you!", "error");

                } else if ($scope.newEvent.category == null || $scope.newEvent.category == 'Select a Category'){

                    swal("Oops", "You need to select a category for your event!", "error");
                
                } else {

                swal({
                  title: "Ready to post your event?",
                  showCancelButton: true,
                  closeOnConfirm: false,
                  showLoaderOnConfirm: true,
                },
                function(){
                  setTimeout(function(){
                    GeolocationFactory.getCurrentLocation().then(
                function(coords) {
                    console.log(userInfo);
                    $scope.newEvent.ownerId = $sessionStorage.uid;
                    $scope.newEvent.timeStamp = Date.now();
                    $scope.newEvent.photoURL = userInfo.photoURL;
                    $scope.newEvent.ownerName = userInfo.displayName;

                    if(userInfo.aboutMe !== undefined ){
                        $scope.newEvent.aboutOwner = userInfo.aboutMe;
                    }
                    if( userInfo.age !== undefined) {
                        $scope.newEvent.age= userInfo.age;
                    }
                    
                    
                    $scope.newEvent.coords = coords;
                    console.log($scope.newEvent);

                    //Get a key for a new event
                    var newEventKey = firebase.database().ref().child('events').push().key;
                    
                    // Write the new post's data simultaneously to the database in 2 places
                    var eventUpdates = {};
                    $scope.newEvent.eventKey = newEventKey;
                    console.log(newEventKey + " <-key not object.");

                    console.log($scope.newEvent);
                    eventUpdates['/events/' + newEventKey] = $scope.newEvent;
                    eventUpdates['/users/' + vm.uid + '/events/' + newEventKey] = $scope.newEvent;

                    $scope.newEvent = {};
                    $scope.newEvent.category = 'Select a Category';

                

                    firebase.database().ref().update(eventUpdates);
                    swal("Nice", "Your event has been posted!", "success");
                    }

                )
                  }, 2000);
                });

            
                }
        }

        $ionicPopover.fromTemplateUrl('js/tabs/create/create.popover.html', {
             scope: $scope,
         }).then(function(popover) {
             $scope.popover = popover;
         });

         $scope.setCategory = function(category) {
            $scope.newEvent.category = category;
            console.log($scope.newEvent.category);
         };

      

       




        

        ////////////////

        function activate() {
            $scope.newEvent.category = 'Select a Category';
            FirebaseFactory.returnUserFromDB($sessionStorage.uid).then(function(user) {
                userInfo = user;
                
            });
        
        }
    }


})();