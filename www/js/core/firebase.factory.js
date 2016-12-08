(function() {
    'use strict';

    angular
        .module('app')
        .factory('FirebaseFactory', FirebaseFactory);

    FirebaseFactory.$inject = ['$http', 'toastr', '$q', '$state', '$sessionStorage', '$rootScope', '$firebaseArray', 'GeolocationFactory'];





    /* @ngInject */
    function FirebaseFactory($http, toastr, $q, $state, $sessionStorage, $rootScope, $firebaseArray, GeolocationFactory) {



      var service = {
            signUp: signUp,
            logIn: logIn,
            logOff: logOff,
            facebookLogIn: facebookLogIn,
            webTesterLogIn: webTesterLogIn,
            userProfileExists: userProfileExists,
            multipleNotificationsFromUIDExists: multipleNotificationsFromUIDExists,
            returnUserFromDB: returnUserFromDB,
            eventExistInOwnerEvents: eventExistInOwnerEvents,
            userExistsInGroups: userExistsInGroups,
            getKeysFromFireRef: getKeysFromFireRef,
            getNewMessageStatus: getNewMessageStatus,
            getUserGroupRefs: getUserGroupRefs,
            returnArrayOfMessageRefs: returnArrayOfMessageRefs,
            returnContentsFromRef: returnContentsFromRef,
            markMessagesAsRead: markMessagesAsRead,
            getCardDecisionInfo: getCardDecisionInfo,
            returnLoadedSnapshot: returnLoadedSnapshot

        };
        return service;

        function returnLoadedSnapshot(ref) {
            // console.log('return loaded snapshot launched======================================================')
            var defer = $q.defer();
            ref.once('value', function(snapshot) {
                if(snapshot.val() === null) {
                    defer.reject('unable to load ref');
                } else {
                    defer.resolve(snapshot.val())
                }
            })
            // console.log('-----------------------------------------------------------------------------')
            console.log(defer)
            return defer.promise;
        }

        function getCardDecisionInfo(searchRef) {
            // console.log('card decision info executed==============================================================');
            var defer = $q.defer()
            var promises = [];
            promises[0] = returnLoadedSnapshot(searchRef);
            promises[1] = returnLoadedSnapshot(firebase.database().ref('/users/' + $sessionStorage.uid +  '/viewedEvents/'));


            $q.all(promises).then(
                function(values) {
                console.log('display values from getAllMessages promise queue return');
                console.log(values);
                defer.resolve(values);
                },
                function(error) {
                    defer.reject('could not return data from data base');
                }
            );
            // console.log('------------------------------------------------------------------------------------------');
            console.log(defer);
            return defer.promise;

        }

        ////////////////
        function markMessagesAsRead(groupMessagesRef, groupId) {
            
           
            getKeysFromFireRef(groupMessagesRef).then(function(keys) {
                keys.forEach(function(k) {
                   firebase.database().ref('/groups/messages/' + groupId + '/' + k + '/readBy/' + $sessionStorage.uid).update({read: true});
                })
            })
            
        }
        

        function getUserGroupRefs(keys) {
            var defer = $q.defer();
            var usersGroupRefs = [];

            if (keys) {
                keys.forEach(function(key) {
                    var messages = $firebaseArray(firebase.database().ref('/groups/messages/' + key));
                    usersGroupRefs.push({messages});
                })
                
                return usersGroupRefs;
            } else {
                return null;
            }

            

        }

        function returnContentsFromRef(ref) {
           
            var defer = $q.defer();
            // ref.messages.once('value', function() {
            //     if(snapshot.val() === null) {
            //         defer.reject('error retrieving once from ref in returnContentsFromRef');
            //     } else {
            //         defer.resolve(snapshot.val());
            //     }
            // })

            ref.messages.$loaded().then(
                function(r) {
                   
                    defer.resolve(r);
                }
            )
            return defer.promise;
        }

        function returnArrayOfMessageRefs() {
           
            var defer = $q.defer();
            var allMessagesRefs = [];
            getKeysFromFireRef(firebase.database().ref('/users/' + $sessionStorage.uid + '/groups')).then(
                
               function(keys) {
                    
                    keys.forEach(function(key) {
                        allMessagesRefs.push({key: firebase.database().ref('/groups/messages/' + key)})
                    })
                   
                    defer.resolve(allMessagesRefs);
                }
                
            )
            
            return defer.promise;
        }

        function getNewMessageStatus(uid) {
            //compares last message time in group with last message time sent by user to return boolean containing hasNewMessage status
           

            var defer = $q.defer();
            var hasNewMessage = false;
            var groupsTime = '';
            var usersTime = '';
            var hasNewMessage = false;
            var hasNewMessageResultsArray = [];

            getKeysFromFireRef(firebase.database().ref('/users/' + uid + '/groups')).then(
                function(keys) {
                    keys.forEach(function(k) {
                        var messages = $firebaseArray(firebase.database().ref('/groups/messages/' + k));
                        messages.$loaded().then(
                            function(m) {
                               
                                var refToCurrentGroup = firebase.database().ref('/users/' + uid + '/groups/' + k);
                                //get time of last message sent by you
                                refToCurrentGroup.once('value', function(snapshot) {
                                    if(snapshot.val() === null) {
                                       
                                        defer.reject('error returning users/id/groups/groupId ');
                                    } else {
                                        usersTime = snapshot.val().timeOfLastMessage;
                                      
                                        var latestMessageTotal = m[m.length -1];
                                        if(latestMessageTotal.timeStamp !== undefined ) {
                                            var groupsTime = latestMessageTotal.timeStamp;

                                            
                                           
                                            // if there is a message later then one sent by you
                                            if(groupsTime > usersTime) {
                                              
                                                // defer.resolve(true)
                                                hasNewMessageResultsArray.push({id: k, status: true});
                                               
                                                refToCurrentGroup.update({hasNewChatEntry: true});

                                            } else {
                                              
                                                // defer.resolve(false);
                                                hasNewMessageResultsArray.push({id: k, status: false});
                                                refToCurrentGroup.update({hasNewChatEntry: false});
                                            }

                                        } // end else if snapshot has value

                                    }
                                })// end once on get last message sent by you


                            }   
                        ) // end then messages.$loaded


                    })
                    defer.resolve(hasNewMessageResultsArray);
                }// end call back function(keys)


            ) // end then from getKeysFromFireref
            return defer.promise;
        }

        function getKeysFromFireRef(ref) {
            var defer = $q.defer();
            var result = [];

            ref.once('value', function(snapshot) {
                if(snapshot.val() === null) {
                    defer.reject('Error retrieving this firebase reference');
                } else {
                    var obj = snapshot.val();
                    var keys = Object.keys(obj)
                    $sessionStorage.usersGroupKeys = keys;
                 
                    defer.resolve(keys)
                }
            })
            return defer.promise;
    }

        function userExistsInGroups(requestingUserId, eventKey) {
            var defer = $q.defer();
            var result = false;

            firebase.database().ref('/groups/users/' + eventKey + '/' + requestingUserId).once('value', function(snapshot) {
                if (snapshot.val() !== null) {
                    result = true;
                }
                defer.resolve(result);
            })
            return defer.promise;
        }


        function eventExistInOwnerEvents(ownerId, eventKey) {
            var defer = $q.defer();
            var result = false;
            firebase.database().ref('/groups/chats/' + eventKey).once('value', function(snapshot) {

                if (snapshot.val() === null) {
                    result = false;
                } else {
                    result = true;
                }
                defer.resolve(result);
            })
            return defer.promise;
        }

        function returnUserFromDB(uid) {

            var defer = $q.defer();
            firebase.database().ref('/users/' + uid).once('value').then(function(snapshot) {
                //assign data to dbUser var
                var result = snapshot.val();

                defer.resolve(result);


            });
            return defer.promise;

        }


        //if user profile exists outside of auth in user table return
        function userProfileExists(uid) {

            var defer = $q.defer();
            var result = false;

            firebase.database().ref('users/' + uid).once('value', function(snapshot) {
                if (snapshot.val() === null) {

                    result = false;


                } else {

                    result = true;
                }

                defer.resolve(result);

            })

            return defer.promise;

        }

        function multipleNotificationsFromUIDExists(ref) {

            var defer = $q.defer();
            var result = false;

            ref.once('value', function(snapshot) {
                var result = snapshot.hasChildren()
              

                defer.resolve(result);

            })

            return defer.promise;

        }


        function signUp(email, password) {
            // Call firebase auth object and execute create user method
            firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
                if (error) {
                    //if error creating new user toast
                    toastr.error(error.message, error.code);
                }
            });
        }

        function logIn(email, password) {
            // Call firebase auth object and execute login
            firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
                toastr.error(error.message, error.code);
            });
        }

        function logOff() {
            firebase.auth().signOut().then(
                function() {
                    toastr.success("We miss you already!")
                    $state.go('login')
                },
                function(error) {
                    toastr.error(error.message);
                });
        }

        function facebookLogIn() {
            // alert('facebookLogin called');
            var defer = $q.defer();

            facebookConnectPlugin.login(['public_profile', 'email'],
                function(res) {
                    var credential = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
                    // alert('got back from facebook');

                    firebase.auth().signInWithCredential(credential)
                        .then(function(user) {
                            // alert('signed into firebase');

                            // alert('Setting $sessionStorage.uid = ' + user.uid);
                            $sessionStorage.uid = user.uid;

                            // alert('Setting $sessionStorage.displayName = ' + user.displayName);
                            $sessionStorage.displayName = user.displayName;

                            // alert('Setting $sessionStorage.photoURL = ' + user.photoURL);
                            $sessionStorage.photoURL = user.photoURL;

                            $rootScope.$emit('userLoggedIn', { uid: user.uid });

                       

                            // alert('check if the user profile exists');
                            userProfileExists(user.uid)
                                .then(function(userProfileExists) {
                                    // alert('success!');
                                    if (!userProfileExists) {
                                        // alert('they don\'t exist');
                                       
                                        var DataBaseRefToLoggedInUser = firebase.database().ref('users/' + firebase.auth().currentUser.uid);

                                        DataBaseRefToLoggedInUser.set({
                                            displayName: user.displayName,
                                            email: user.email,
                                            photoURL: user.photoURL,
                                            category: 'Select an activity'
                                        });
                                        defer.resolve('Created new user');
                                    } else {
                                        // alert("they do exist (aliens are");
                                        defer.resolve('Returning user');
                                    }
                                  
                                }, function(error) {
                                    alert('error time :(');
                                    defer.reject(error);
                                });
                        })
                        .catch(function(error) {
                            // Handle Errors here.
                            var errorCode = error.code;
                            var errorMessage = error.message;
                            // The email of the user's account used.
                            var email = error.email;
                            // The firebase.auth.AuthCredential type that was used.
                            var credential = error.credential;
                            // [START_EXCLUDE]
                            if (errorCode === 'auth/account-exists-with-different-credential') {
                                toastr.error('You have already signed up with a different auth provider for that email.');
                            } else {
                                toastr.error(error);
                            }
                            defer.reject(error);
                            // [END_EXCLUDE]
                        });
                },
                function(err) {
                    defer.reject(err);
                });

            return defer.promise;
        }


        /*******************************************
            Start of the web testing services
        *******************************************/

        function webTesterLogIn() {
          
            var provider = new firebase.auth.FacebookAuthProvider();

            var defer = $q.defer();
            var result = '';

            firebase.auth().signInWithPopup(provider)
                .then(function(result) {
                    



                    $sessionStorage.uid = result.user.uid;
                    $sessionStorage.displayName = result.user.displayName;
                    $sessionStorage.photoURL = result.user.photoURL;


                   
                   GeolocationFactory.getCurrentLocation().then(
                        function(result) {
                            $sessionStorage.coords = result;

                        }
                    )
                    // console.log( $sessionStorage.coords);

                    // GeolocationFactory.getIsEventInArea(userLocation);
                    

                    getKeysFromFireRef(firebase.database().ref('/users/' + $sessionStorage.uid + '/groups')).then(
                         function(keys) { 
                            console.log('got keys: ' + keys);
                            // $sessionStorage.usersGroupKeys = keys;
                         },
                         function(error) {
                            console.log('error retrieving keys: ' + error);
                         }
                    )
                   
                    

                    
                    $rootScope.$emit('userLoggedIn', {uid: result.user.uid});

                    console.log( $sessionStorage.uid);
                    userProfileExists(result.user.uid).then(function(userProfileExists) {
                        if (!userProfileExists) {
                            console.log('user profile doesnt exist yet');
                            var DataBaseRefToLoggedInUser = firebase.database().ref('users/' + firebase.auth().currentUser.uid);

                            //set a default search radius for geolocation
                            if(result.radius === undefined) {
                                            $sessionStorage.searchRadius = 5
                                        } else {
                                            $sessionStorage.searchRadius = result.radius;
                                        }

                            DataBaseRefToLoggedInUser.set({
                                displayName: result.user.displayName,
                                email: result.user.email,
                                photoURL: result.user.photoURL,
                                category: 'Select an activity'

                            });
                            result = 'Created new user';
                            defer.resolve(result);
                        } else {
                            // get search radius
                            returnUserFromDB($sessionStorage.uid).then(
                                function(result) {
                                     if(result.radius === undefined) {
                                            $sessionStorage.searchRadius = 5
                                        } else {
                                            $sessionStorage.searchRadius = result.radius;
                                        }
                                    
                                    
                                    console.log($sessionStorage.searchRadius);
                                   defer.resolve('Returning user');
                                }
                            )

                            // result = 'Returning user';
                            // defer.resolve(result);
                        }
                        console.log('hits promise');
                    })
                }).catch(function(error) {
                    // Handle Errors here.
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    // The email of the user's account used.
                    var email = error.email;
                    // The firebase.auth.AuthCredential type that was used.
                    var credential = error.credential;
                    // [START_EXCLUDE]
                    if (errorCode === 'auth/account-exists-with-different-credential') {
                        toastr.error('You have already signed up with a different auth provider for that email.');
                    } else {
                        toastr.error(error);
                    }
                    // [END_EXCLUDE]
                });

            return defer.promise;
        }

        /*******************************************
            end of the web testing services
        *******************************************/






    }
})();
