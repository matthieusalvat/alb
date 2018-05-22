$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
		return null;
    } else{
		return decodeURIComponent(results[1]) || 0;
    }
}
const ref = new Webcom("https://io.datasync.orange.com/base/alb");
let news={};
let currentUser;
let currentProfile;

function checkConnected() {
	//console.log("checkConnected", currentUser, currentProfile);
	if (currentUser) {
		$(".pseudo").text(currentProfile? currentProfile.pseudo : currentUser.providerUid);
		$(".not-connected").hide();
		$(".connected").show();
		if (currentProfile && currentProfile.email.substr(-14) == '@al-begard.org') {
			//console.log("Show admin");
			$(".admin.connected").show();
		} else {
			//console.log("Hide admin");
		  	$(".admin.connected").hide();
		}
	} else {
		$(".connected").hide();
		$(".not-connected").show();
	}
}

function checkAuth(error, user) {
	//console.log("checkAuth", error, user);
	if (error) {
		currentUser=null;
		checkConnected();
		console.log("auth error: " + error);
	} else {
		if (user) {
			//console.log("user", user);
			currentUser=user;
			checkConnected();
			$(".not-connected").hide();
			$(".connected").show();
			$(".pseudo").text(user.providerUid);
			ref.child("users").child(user.uid).once("value", (snapshot) => {
				currentProfile=snapshot.val();
				if (!currentProfile) {
					$("#login-modal").modal("hide");
					$("#profile-modal").modal("show");
				} else {
					checkConnected();
					$("#login-modal").modal("hide");
				}
			});
			} else {
				console.log("not authenticated");
				currentUser=null;
				checkConnected();
			}
	}
}


$(function() {	
	$("#edit-action-done").bootstrapToggle({
		on: 'Oui',
		off: 'Non'
    });
	
    ref.resume(checkAuth);
	
	$(".profile").on("click", (e) => {
		//console.log("profile", currentProfile);
		if (currentProfile) {
			$("#firstname").val(currentProfile.firstname);
			$("#lastname").val(currentProfile.lastname);
			$("#pseudo").val(currentProfile.pseudo);
			$("#mobile").val(currentProfile.mobile);
		}
		$("#register-modal").modal("hide");
		$("#login-modal").modal("hide");
		$("#profile-modal").modal("show");
	});

	$("body").on("click", ".login", (e) => {
		$("#register-modal").modal("hide");
		$("#profile-modal").modal("hide");
		$("#login-modal").modal("show");
	});

	$(".register").on("click", (e) => {
		$("#login-modal").modal("hide");
		$("#profile-modal").modal("hide");
		$("#register-modal").modal("show");
	});

	$(".logout").on("click", (e) => {
		ref.logout();
	});
	
	$("#login-button").on("click", (e) => {
		const email = $("#email").val();
		const password = $("#password").val();
		if (! email || ! email.match(/^\w.*\@.*$/)) {
			$("#login-error").text("Merci de renseigner un e-mail valide").show();
		} else {
			ref.authWithPassword({
				email : email,
				password : password,
				rememberMe : true
			}, (error, user) => {
				if (error) {
					$("#login-error").text(error).show();
				}
			})
		}
	});

	$('#profile-button').on("click", (e) => {
		$("#profile-error").text("").hide();
		const firstname = $("#firstname").val();
		const lastname = $("#lastname").val();
		const pseudo = $("#pseudo").val();
		const mobile = $("#mobile").val();
		if (! firstname) {
			$("#profile-error").text("Merci de renseigner votre prénom").show();
		} else if (! lastname) {
			$("#profile-error").text("Merci de renseigner votre nom").show();
		} else if (! pseudo) {
			$("#profile-error").text("Merci de renseigner votre pseudo").show();
		}
		const profile = { firstname, lastname, pseudo, mobile, email: currentUser.providerUid };
		ref.child("users").child(currentUser.uid).update(
			profile,
			(error) => {
				if (error) {
					$("#profile-error").text("error").show();
				} else {
					currentProfile=profile;
					$("#profile-modal").modal("hide");
				}
			}
		);
	});
	
	$('#register-button').on("click", (e) => {
		$("#register-error").text("").hide();
		const email = $("#register-email").val();
		const password1 = $("#password1").val();
		const password2 = $("#password2").val();
		if (! email || ! email.match(/^\w.*\@.*$/)) {
			$("#register-error").text("Merci de renseigner un e-mail valide").show();
		}else if ((!password1 || password1.length<6) && (!password2 || password2.length<6)) {
			$("#register-error").text("Votre mot de passe doit faire au moins 6 caractères et contenir des miniscules, majuscules et au moins un chiffre").show();
		}else if (password1!=password2) {
			$("#register-error").text("Les deux mots de passe ne sont pas identique").show();
		} else {
			ref.createUser(email, password1, function(error, user){
				if (error) {
					$("#register-error").text(error).show();
				} else {
					$("#register-info").html("Votre compte est en attente de validation. Merci de le confirmer en cliquant sur le lien que vous avez reçu par email. Quand c'est fait, veuillez vous connecter en <a href='#' class='login'>cliquant ici</a>").show();
				}
			});
			
		}
	});
});
