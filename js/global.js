$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
		return null;
    } else{
		return decodeURIComponent(results[1]) || 0;
    }
}
const ref = new Webcom("https://io.datasync.orange.com/base/alb");
const providerIcons={
	"google" : "fa fa-google",
	"facebook" : "fa fa-facebook-official",
	"password" : "fa fa-envelope"
};
let news={};
let currentUser;
let currentProfile;
let users=null;

function logAction(page, type, action, data) {
	if (ref && currentUser) {
		const date=formatDate(Date.now());
		data = data ? data : {};
		let pseudo="";
		let email="";
		if (currentProfile && currentProfile.pseudo) {
			pseudo=currentProfile.pseudo;
			email=currentProfile.email;
		}
		ref.child("log").child(date).push({
			page,
			type,
			data,
			action,
			email,
			pseudo,
			time: Webcom.ServerValue.TIMESTAMP,
			uid: currentUser.uid,
		});
	}
}

function insertAtCaret(areaId,text) {
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? 
			  "ff" : (document.selection ? "ie" : false ) );
    if (br == "ie") { 
        txtarea.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -txtarea.value.length);
        strPos = range.text.length;
    }
    else if (br == "ff") strPos = txtarea.selectionStart;
	
    var front = (txtarea.value).substring(0,strPos);  
    var back = (txtarea.value).substring(strPos,txtarea.value.length); 
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") { 
        txtarea.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -txtarea.value.length);
        range.moveStart ('character', strPos);
        range.moveEnd ('character', 0);
        range.select();
    }
    else if (br == "ff") {
        txtarea.selectionStart = strPos;
        txtarea.selectionEnd = strPos;
        txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
}

function formatDate(time, human) {
    let date = new Date(time);
	
    let day = date.getDate();
    if (day < 10) {
        day = '0' + day;
    }
    let month = date.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }
	let year = date.getFullYear();
	if (human) {
		return day+"/"+month+"/"+year;
	} else {
		return year+"-"+month+"-"+day;
	}
}

function formatTimestamp(time, withDate) {
    let date = new Date(time);
	
    let day = date.getDate();
    if (day < 10) {
        day = '0' + day;
    }
    let month = date.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }
    let hours = date.getHours();
    if (hours < 10) {
        hours = '0' + hours;
    }
    let minutes = date.getMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    let seconds = date.getSeconds();
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    let str=hours + ':' + minutes + ':' + seconds;
    if (withDate) {
		str=day+"/"+month+"-"+str;
    }
    return str;
};

let lastDate;
function addLogs(d) {
	const date = formatDate(d || Date.now());
	if (lastDate) {
		$("#log-entries").empty();
		ref.child("log").child(lastDate).off("child_added");
	}
	const tr = {
		"edit": "Modification",
		"create": "Création",
		"remove": "Suppression",
		"subscribe": "Inscription",
		"unsubscribe": "Désinscription",
		"news" : "Actualités",
		"planning" : "Stand",
		"todo" : "Truc à faire"
	};
	ref.child("log").child(date).on("child_added", (snapshot) => {
		const data = snapshot.val();
		const messageDiv=$("<dd>").text((tr[data.type] || data.type)+" \""+(tr[data.page] || data.page) +"\" \""+data.action+"\"");
		$("#log-entries").prepend(messageDiv).prepend($("<dt>").text(formatTimestamp(data.time, false)+" "+data.pseudo));
	});
	lastDate=formatDate(date);
}

function addChat() {
	ref.child("chat").child("benevoles").on("child_added", (snapshot) => {
		const data = snapshot.val();
        const parts=data.message.split(/(\[:[^\]]*\]|\s+)/);
        const messageDiv=$("<dd>");
        parts.forEach(function(part) {
            if (part) {
				if (m=part.match(/^\[:([^\]]*)\]$/)) {
					messageDiv.append($("<a>").addClass('totoz').attr('href', "#"+m[1]).text(part+" ").append($("<img>").attr('src', 'https://totoz.eu/'+m[1]+'.gif')));
				} else if (m=part.match(/^(\d\d\/\d\d-)?(\d\d):(\d\d):(\d\d)$/)) {
					let timeRef=m[2]+m[3]+m[4];
					messageDiv.append($("<span>").addClass("time").attr('ref', part).text(part+" "));
				} else if (m=part.match(/([a-zA-Z0-9\-]+)</)) {
					let userRef=m[1];
					messageDiv.append($("<span>").addClass("user").attr('ref', m[1]).text(part+" "));
				} else if (m=part.match(/^(.*)((https?|ftp|gopher):\/\/[^),]+)(.*)$/)) {
					messageDiv.append($("<span>").text(m[1])).append($("<a>").attr('target', "_blank").attr('href', m[2]).text(m[2])).append($("<span>").text(m[4]));
				} else {
					messageDiv.append($("<span>").text(part+" "));
				}
            }
		});
		
		$("#chat-messages").prepend(messageDiv).prepend(($("<dt>").html("<span class='time' ref='"+formatTimestamp(data.time, true)+"'>["+formatTimestamp(data.time, true).replace("-", " ") + "]</span> <span class='user' uid='"+data.uid+"' ref='"+data.pseudo+"'>" + data.pseudo + "</span>")));
	});
}

function checkConnected() {
	//console.log("checkConnected", currentUser, currentProfile);
	if (currentUser) {
		$(".pseudo").text(currentProfile? currentProfile.pseudo : currentUser.displayName);
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
	if (error) {
		currentUser=null;
		users=null;
		checkConnected();
		console.log("auth error: " + error);
	} else {
		if (user) {
			currentUser=user;
			checkConnected();
			$(".not-connected").hide();
			$(".connected").show();
			$(".pseudo").html(user.providerUid);
			$(".provider").html(`&nbsp;<i class='fa fa-${providerIcons[user.provider]}'></i>`);
			
			if (currentUser.providerUid.substr(-14) == '@al-begard.org') {
				addLogs();			
				ref.child("users").once("value", (snapshot) => {
					users = snapshot.val();
				});
			}
			addChat();
			$('.datepicker').val(formatDate(Date.now(), true));
			ref.child("users").child(user.uid).once("value", (snapshot) => {
				currentProfile=snapshot.val();
				if (!currentProfile) {
					if (currentUser.provider == 'google') {
						currentUser.providerUid=currentUser.providerProfile.email;
						$("#pseudo").val(currentUser.displayName);
						$("#firstname").val(currentUser.providerProfile.given_name);
						$("#lastname").val(currentUser.providerProfile.family_name);
						$("#profileEmail").val(currentUser.providerProfile.email);
					} else if (currentUser.provider == 'facebook') {
						currentUser.providerUid=currentUser.providerProfile.email;
						$("#pseudo").val(currentUser.displayName);
						$("#firstname").val(currentUser.providerProfile.first_name);
						$("#lastname").val(currentUser.providerProfile.last_name);
						$("#profileEmail").val(currentUser.providerProfile.email);
					} else if (currentUser.provider == 'password') {
						$("#profileEmail").val(currentUser.providerUid);
						if (currentUser.providerUid.substr(-14) == '@al-begard.org') {
							let pseudo=currentUser.providerUid.replace('@al-begard.org', '');
							$("#pseudo").val(pseudo.charAt(0).toUpperCase() + pseudo.slice(1));
							$("#firstname").val(pseudo.charAt(0).toUpperCase() + pseudo.slice(1));
						}
					}
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
				users=null;
				checkConnected();
			}
	}
}


$(function() {
	$('.datepicker').datepicker({
		language: 'fr',
		endDate: '+0d',
		startDate: '-2m',
		todayHighlight: true,
		autoclose: true,
	}).on("changeDate", (e, date) => {
		addLogs(e.date);
	});
	
	$("#edit-action-done").bootstrapToggle({
		on: 'Oui',
		off: 'Non'
    });
	
    ref.resume(checkAuth);
	
    $("#chat-modal").on("click", "dt span.user", (e) => {
		const userId=$(e.target).text();
		const txtToAdd=userId+"< ";
		insertAtCaret("chat-message", txtToAdd);
    });
	
    $("#chat-modal").on("click", "dt span.time", function(e) {
		let time=$(e.target).attr('ref');
		let txtToAdd=time+" ";
		insertAtCaret("chat-message", txtToAdd);
    });
	
    $("#chat-modal").on("mouseover", "span.time", (e) => {
		$("#chat-modal span.time[ref='"+$(e.target).attr('ref')+"']").addClass("highlight");
    });
	
    $("#chat-modal").on("mouseout", "span.time", (e) => {
		$("#chat-modal span.time").removeClass("highlight");
    });
	
    $("#chat-modal").on("mouseover", "span.user", (e) => {
		$("#chat-modal span.user[ref='"+$(e.target).attr('ref')+"']").addClass("highlight");
    });
	
    $("#chat-modal").on("mouseout", "span.user", (e) => {
		$("#chat-modal span.user").removeClass("highlight");
    });
	
    $("#chat-modal").on("mouseover", "a.totoz", (e) => {
		$(e.target).children().show();
    });
	
    $("#chat-modal").on("mouseout", "a.totoz", (e) => {
		$(e.target).children().hide();
    });
	
    $("#chat-message").keypress(function (e) {
		if (e.which == 13) {
			$("#send-message").trigger("click");
			return false;
		}
    });
	
	$("#send-message").on("click", (e) => {
		if (currentUser && currentProfile) {
			const msg = $("#chat-message").val();
			const message = {
				uid: currentUser.uid,
				pseudo: currentProfile.pseudo,
				email: currentProfile.email,
				time: Webcom.ServerValue.TIMESTAMP,
				message: msg
			};
			ref.child("chat").child("benevoles").push(message, (error)=>{
				if (error) {
				} else {
					$("#chat-message").val("");					
				}
			});
		};
	});
	
	$("body").on("click", ".chat", (e) => {
		$("#register-modal").modal("hide");
		$("#login-modal").modal("hide");
		$("#profile-modal").modal("hide");
		$("#log-modal").modal("hide");
		$("#password-lost-modal").modal("hide");
		$("#chat-modal").modal("show");
	});

	$("body").on("click", ".log", (e) => {
		$("#register-modal").modal("hide");
		$("#login-modal").modal("hide");
		$("#profile-modal").modal("hide");
		$("#password-lost-modal").modal("hide");
		$("#chat-modal").modal("hide");
		$("#log-modal").modal("show");
	});
	
	$(".profile").on("click", (e) => {
		//console.log("profile", currentProfile);
		if (currentProfile) {
			$("#firstname").val(currentProfile.firstname);
			$("#profileEmail").val(currentProfile.email);
			$("#activity").val(currentProfile.activity);
			$("#lastname").val(currentProfile.lastname);
			$("#pseudo").attr("old", currentProfile.pseudo).val(currentProfile.pseudo);
			$("#mobile").val(currentProfile.mobile);
		}
		$("#register-modal").modal("hide");
		$("#login-modal").modal("hide");
		$("#password-lost-modal").modal("hide");
		$("#profile-modal").modal("show");
	});

	$("body").on("click", ".login", (e) => {
		$("#register-modal").modal("hide");
		$("#profile-modal").modal("hide");
		$("#password-lost-modal").modal("hide");
		$("#login-modal").modal("show");
	});

	$(".register").on("click", (e) => {
		$("#login-modal").modal("hide");
		$("#profile-modal").modal("hide");
		$("#password-lost-modal").modal("hide");
		$("#register-modal").modal("show");
	});

	$(".password-lost").on("click", (e) => {
		$("#register-modal").modal("hide");
		$("#login-modal").modal("hide");
		$("#profile-modal").modal("hide");
		$("#password-lost-modal").modal("show");
	});


	
	$(".logout").on("click", (e) => {
		$("#chat-messages").empty();
		$("#log-entries").empty();
		if (currentUser.providerUid.substr(-14) == '@al-begard.org') {
			ref.child("log").child(lastDate).off("child_added");
		}
		ref.child("chat").child("benevoles").off("child_added");
		ref.logout();
	});

	$("#password").keypress(function (e) {
		if (e.which == 13) {
			$("#login-button").trigger("click");
			return false;
		}
    });

	$("#google").on("click", () => ref.authWithOAuth("google"));
	$("#facebook").on("click", () => ref.authWithOAuth("facebook"));
	
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
		const activity = $("#activity").val();
		const email = $("#profileEmail").val();
		const oldPseudo = $("#pseudo").attr("old");
		let mobile = $("#mobile").val();
		if (mobile) {
			mobile=mobile.replace(/[^\d]/g, '').match(/.{2}/g).join(" ");
		}
		if (! firstname) {
			$("#profile-error").text("Merci de renseigner votre prénom").show();
		} else if (! lastname) {
			$("#profile-error").text("Merci de renseigner votre nom").show();
		} else if (! pseudo) {
			$("#profile-error").text("Merci de renseigner votre pseudo").show();
		}
		ref.child("pseudos").once("value", (snapshot) => {
			const pseudos = snapshot.val() || {};
			if (pseudos[pseudo] && pseudos[pseudo] != currentUser.uid) {
				$("#profile-error").text("Ce pseudo est déjà utilisé, merci d'en choisir un autre").show();
			} else {
				if (oldPseudo && oldPseudo != pseudo) {
					ref.child("pseudos").child(oldPseudo).remove();
				}
				ref.child("pseudos").child(pseudo).set(currentUser.uid);
				const profile = { firstname, lastname, pseudo, mobile, activity, email, provider:  currentUser.provider};
				ref.child("users").child(currentUser.uid).update(
					profile,
					(error) => {
						if (error) {
							console.log(error);
							$("#profile-error").text("error").show();
						} else {
							currentProfile=profile;
							$("#profile-modal").modal("hide");
							checkConnected();
						}
					}
				);
			}
		});
	});
	$('#password-lost-button').on("click", (e) => {
		$("#password-lost-error").text("").hide();
		const email = $("#password-lost-email").val();
		if (! email || ! email.match(/^\w.*\@.*$/)) {
			$("#password-lost-error").text("Merci de renseigner un e-mail valide").show();
		} else {
			ref.sendPasswordResetEmail(email, function(error, user){
				if (error) {
					$("#password-lost-error").text(error).show();
				} else {
					$("#password-lost-info").html("Un e-mail vient d'être envoyé pour réinitialiser votre mot de passe. Une fois que vous aurez changé de mot de passe, vous pouvez vous connecter en <a href='#' class='login'>cliquant ici</a>").show();
				}
			});
		}
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
