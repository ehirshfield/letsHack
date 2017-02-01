$(document).ready(function() {
    //console.log("ready");
    firebase.initializeApp(config);
	var database = firebase.database();
    
    var myPointer;
    var myRef;
    var partnerPointer;
    var partnerRef;

    var sessionRef = database.ref("activeSessions/" + sessionData.sessionId);
    myRef = sessionRef.push(myPlayer, function(err){
        if (err) console.err(err);
        myPointer = myRef.getKey();
    });
    myRef.onDisconnect().remove();

    function addBRTags(input){
        return input.split("\n").join("<br />");
    }

    // when this session changes value
    sessionRef.on("value", function(snapshot){
        var usersConnected  = snapshot.numChildren();
        //console.log("users connected:", usersConnected);
        if (usersConnected === 2 && myPointer) {
            // game has started, loop through users on change
            for (user in snapshot.val()){
                if (user === myPointer){
                    //console.log("found myself");
                } else {
                    // watch for partner's typing
                    var partnersCode = snapshot.child(user).val().codeSoFar;
                    $("#partner-code .code-input").html(addBRTags(partnersCode));
                }
            }
        }
    });

    // send my code typing to db
    $("#your-code .code-input").on("focus", function(){
        $("body").on("keyup", function(event){
            var code = $("#your-code .code-input").val().trim();
            myRef.child("/codeSoFar").set(code);
		});
    }).on("focusout", function(){
		$("body").off("keyup");
	});

    createChatRoom(sessionData.sessionId, 2, user.displayName, database);

  /*
  // code to execute tests 
  on submit (
    if (
      var inputA = eval(codeA-input.val); 
      var inputB = eval(codeB-input.val);
 
 // OR

      {{inputA}}
            
      {{inputB}}

    var test = function(){
      {{test}}
    };
    
    if (test)
      {
        showTestSuccess();
      }
      else {
        showTestFail();
      }

    */
});