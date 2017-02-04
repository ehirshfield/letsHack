$(document).ready(function() {
    
    function addBRTags(input){
        if (input && typeof input === "string" && input.length > 1){
            return input.split("\n").join("<br />");
        }
    }

    function challengeSuccess(){
        console.log("calling challenge success");
        // update the session record to show success
        $.ajax({
            type: "PUT",
            url:"/session/update",
            data: {
                success: true,
                id: sessionData.sessionId
            },
            success: function(response){
                if (response){
                    console.log("session updated! ", response);
                    openModal("Success!", "You both passed your challenge, nice team work, you guys! Head back to the lobby for more challenge fun!", "Lobby", function(){window.location = "/lobby"});
                } else {
                    console.log("not able to update session", sessionData.sessionId);
                }
            }
        });
    }

    function testMyCode(){
        //Take the player's code
        var userCode = $("#userCode").val();

        //Test for user, should not matter as each user is loaded a different test
        var challengeTest = $("input#myTest").val();

        var passedTest = false;

        //try { 
            if (eval("(" + userCode + ")()") == challengeTest){
                passedTest = true;
            }
  //      }
  //      catch (err) {
  //          openModal("Your code threw an error", err, "OK", closeModal);
  //      }
  //      finally {
            if (passedTest) {
                myRef.update({
                    finished: 1
                });
                iPassedTest = true;
                if (partnerPassedTest){
                    //we both passed yay!
                    challengeSuccess();
                } else {
                    // I passed, my parnter hasn't yet
                    openModal("Nice work!", "Your partner is still working, see if you can help them out using the chat.", "OK", closeModal);
                }
            } else {
                //i didn't pass
                openModal("Your code didn't return the expected result.", "Keep trying!", "OK", closeModal);
            }
        //}
    }

    firebase.initializeApp(config);
	var database = firebase.database();
    //console.log(user);

    //use this shared key as the firebase container
    var matchId = $(".dataHolder").data().matchid;
    var myPointer;
    var partnerName = $(".dataHolder").data().partnername;
    var partnerPresent = false;
    var iPassedTest = false;
    var partnerPassedTest = false;
    var sessionRef = database.ref("activeSessions/" + matchId);
    var myRef = sessionRef.push(user);
    myRef.onDisconnect().remove();
    //put the starter code into the textarea
    $("#userCode").val($(".dataHolder").data().startCode);

    // when this firebase challenge changes value
    sessionRef.on("value", function(snapshot){
        myPointer = myRef.getKey();
        var usersConnected  = snapshot.numChildren();
        //console.log("users connected:", usersConnected);
        if (usersConnected === 2 && myPointer) {
            // game has started, loop through users on change
            for (record in snapshot.val()){
                if (record === myPointer){
                    //console.log("found myself");
                } else {
                    // watch for partner's typing
                    partnerPresent = true;
                    var partnersCode = snapshot.child(record).val().codeSoFar;
                    $("#partner-code .code-input").html(addBRTags(partnersCode));
                    // watch for partner passed test
                    if (snapshot.child(record).val().finished === 1){
                        partnerPassedTest = true;
                        if (iPassedTest){
                            //we both passed yay!
                            challengeSuccess();
                        }
                    }
                }
            }
        } else if (usersConnected < 2 && partnerPresent === true){
            //partner was here, but they disconnected
            openModal(partnerName + " Disconnected", "Oops, it looks like your partner was disconnected. Get matched up with someone else to try another challenge.", "Go Back to Lobby", function(){window.location = "/lobby";});
        } else if (usersConnected > 2){
            //there are more than 2 people in this challenge... awkward!
            openModal("Room is Full", "Hm, something went wrong, that challenge is already full. Get matched up with someone else to try another challenge.", "Go Back to Lobby", function(){window.location = "/lobby";});
        }
    });

    // start up chat
    createChatRoom(matchId, 2, user.displayName, database);


    // *** EVENT LISTENERS ***

    // send my code typing to db
    $("#your-code .code-input").on("focus", function(){
        $("body").on("keyup", function(event){
            var code = $("#your-code .code-input").val().trim();
            myRef.child("/codeSoFar").set(code);
		});
    }).on("focusout", function(){
		$("body").off("keyup");
	});

    $("button.testMyCode").on("click", testMyCode);
});
