$(function() {
	let todos;
	let planning;
	const hash = location.hash;
	let year = new Date().getFullYear();
	if ($.urlParam("y")) {
		year = $.urlParam("y");
	}
	$("#year").text(year);
	$(".yearRef").each((i, e) => {
		if ($(e).attr("src")) {
			$(e).attr("src", $(e).attr("src").replace("-YYYY", "-"+year));
		}
		if ($(e).attr("href")) {
			$(e).attr("href", $(e).attr("href").replace("-YYYY", "-"+year));
		}
	});
	/*
	const stallMDE = new SimpleMDE({ element: $("#edit-stall-description")[0], spellChecker: false });
	$("#edit-stall").on('shown.bs.modal', () => {
		stallMDE.codemirror.refresh();
	});
	
	const todoMDE = new SimpleMDE({ element: $("#edit-progression")[0], spellChecker: false });
	$("#edit-todo").on('shown.bs.modal', () => {
		todoMDE.codemirror.refresh();
	});
	*/
	const clipboard = new ClipboardJS('#clipboard');
	clipboard.on('success', function(e) {
		$('#clipboard').popover('show');
		setTimeout(function() {$('#clipboard').popover('hide')}, 2000);
		e.clearSelection();
	});
	
	$("#view-previous-year").on("click", (e) => {
		window.location="./?y="+(year-1);
	});

	$("#view-current-year").on("click", (e) => {
		window.location="./?y="+new Date().getFullYear();
	});

	$("#export-planning").on("click", (e) => {
		exportPlanning();
		$("#export-modal").modal("show");
	});

	
	$("#export-detailed-planning").on("click", (e) => {
		exportPlanning(true);
		$("#export-modal").modal("show");
	});

	function extractPhoneNumber(line) {
		let number=null;
		if (m=line.match(/(\d\d[.-\s]?){5}/)) {
			number=m[0].replace(/[^\d]*/g, "");
		}
		return number;
	}

	function extractEmail(line) {
	    let email=null;
	    if (m=line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/)) {
		email=m[0];
	    }
	    return email;
	}
	
    
	function exportPlanning(withDetail) {
		$("#export-div").empty();
	    phoneNumbers={};
	    emails={};
		for (let day in planning) {
			if ($("#planning-"+day).length) {
				for (let stall in planning[day]) {
					planning[day][stall].stall=stall;
				}
				const table = $("<table>").css('border-collapse', 'collapse');
				const byHours = Object.values(planning[day]).sort((a,b) => {return parseInt(a.start) - parseInt(b.start)});
				for (let i =0; i<byHours.length;i++) {
					const stall=byHours[i].stall;
					//for (let stall in planning[day]) {
					const infos = planning[day][stall];
					const tr = $("<tr>");
					const enrol = infos.enrol || {};
					let customEnrol = (infos.customEnrol || "").split(/\n/);
					customEnrol=customEnrol.filter(c=>c.match(/\w/));
					customEnrol.forEach(c=> {
					    const number=extractPhoneNumber(c);
					    const email=extractEmail(c);
					    if (number) {
						if (! phoneNumbers[day+" "+infos.start+"-"+infos.end]) {
						    phoneNumbers[day+" "+infos.start+"-"+infos.end]={};
						}
						phoneNumbers[day+" "+infos.start+"-"+infos.end][number]=true;
					    }
					    if (email) {
						if (! emails[day+" "+infos.start+"-"+infos.end]) {
						    emails[day+" "+infos.start+"-"+infos.end]={};
						}
						emails[day+" "+infos.start+"-"+infos.end][email]=true;
					    }

					});
					let enroled = Object.keys(enrol).length+customEnrol.length;
					let enroledText="";
					for (uid in enrol) {
						const e=enrol[uid];
						if (typeof e == 'object') {
							if (withDetail && users && users[uid]) {
								userInfos = users[uid].firstname+" "+users[uid].lastname+" "+users[uid].email+" "+users[uid].mobile;
								if (users[uid].mobile) {
								    number=users[uid].mobile.replace(/[^\d]*/g, "");
								    if (! phoneNumbers[day+" "+infos.start+"-"+infos.end]) {
									phoneNumbers[day+" "+infos.start+"-"+infos.end]={};
								    }
								    phoneNumbers[day+" "+infos.start+"-"+infos.end][number]=true;
								}
							    if (users[uid].email) {
								if (! emails[day+" "+infos.start+"-"+infos.end]) {
								    emails[day+" "+infos.start+"-"+infos.end]={};
								}
								emails[day+" "+infos.start+"-"+infos.end][users[uid].email]=true;
							    }
								enroledText+='<br>'+userInfos;
							} else {
								enroledText+='<br>'+e.pseudo;
							}
							if (e.number>1) {
								enroled+=(e.number-1);
								enroledText+="+"+(e.number-1);
							}
						} else {
							enroledText+='<br>'+e;
						}
					}
					if (customEnrol.length>0) {
						customEnrol.forEach((c) => {
							if (withDetail) {
								enroledText+="<br>"+c;
							} else {
								enroledText+="<br>"+c.split(/\s/)[0];
							}
						});
						//enroledText+="<br>+"+customEnrol.length;
					}
					
					let bc, c;
					c="black";
					if (enroled < infos.min) {
						bc="#fb8888";
						if (enroled >= (infos.min/2)) {
							bc="#ffbd43";
						}
					}else{
						bc="#d6ffd6";
					}
					if (infos.min==0) {
						bc="#7d7c7c"
						c="white";
					}
					tr.css('background-color', bc);
					tr.css('color', c);
					tr.append($("<td>").css("border", "1px solid black").text(stall));
					tr.append($("<td>").css("border", "1px solid black").html(infos.start+"h&nbsp;-&nbsp;"+infos.end+"h"));
					tr.append($("<td>").css("border", "1px solid black").html(infos.description.replace(/\n/g, '<br/>')));
					tr.append($("<td>").css("border", "1px solid black").text(enroled+"/"+infos.min));
					tr.append($("<td>").css("border", "1px solid black").css('max-width', '100%').html(enroledText));
					table.addClass("export-table").append(tr);
				}
				$("#export-div .modal")
				$("#export-div").prepend(table);
				$("#export-div").prepend($("<h2>").text(day));
			}
		}
		if (withDetail) {
		    const tablePhoneNumbers = $("<table>").css('border-collapse', 'collapse');
		    Object.keys(phoneNumbers).sort().forEach(d => {
			tablePhoneNumbers.append($("<tr>")
				     .append($("<td>").css("border", "1px solid black").text(d+"h"))
				     .append($("<td>").css("border", "1px solid black").text(Object.keys(phoneNumbers[d]).join(", ")))
				    );
		    });
		    $("#export-div").prepend(tablePhoneNumbers);
		    $("#export-div").prepend($("<h2>").css('text-transform', 'none').text("Liste des numéros de téléphone des bénévoles"));
		    const tableEmails = $("<table>").css('border-collapse', 'collapse');
		    Object.keys(emails).sort().forEach(d => {
			tableEmails.append($("<tr>")
					   .append($("<td>").css("border", "1px solid black").text(d+"h"))
					   .append($("<td>").css("border", "1px solid black").text(Object.keys(emails[d]).join(", ")))
				    );
		    });
		    $("#export-div").prepend(tableEmails);
		    $("#export-div").prepend($("<h2>").css('text-transform', 'none').text("Liste des e-mails des bénévoles"));
		    
		}
	}
	
	ref.child("kermesse").child(year).child("planning").on("value", (snapshot) => {
		planning = snapshot.val();
		for (let day in planning) {
			if ($("#planning-"+day).length) {
				for (let stall in planning[day]) {
					planning[day][stall].stall=stall;
				}
				const byHours = Object.values(planning[day]).sort((a,b) => {return parseInt(a.start) - parseInt(b.start)});
				$("#planning-"+day).empty();
				for (let i =0; i<byHours.length;i++) {
					const stall=byHours[i].stall;
				//for (let stall in planning[day]) {
					const infos = planning[day][stall];
					const tr = $("<tr>");
					const enrol = infos.enrol || {};
					let customEnrol = (infos.customEnrol || "").split(/\n/);
					customEnrol=customEnrol.filter(c=>c.match(/\w/));
					let enroled = Object.keys(enrol).length+customEnrol.length;
					let enroledText="";
					Object.values(enrol).forEach((e) => {
						if (typeof e == 'object') {
							enroledText+='<br>'+e.pseudo;
							if (e.number>1) {
								enroled+=(e.number-1);
								enroledText+="+"+(e.number-1);
							}
						} else {
							enroledText+='<br>'+e;
						}
					});
					if (customEnrol.length>0) {
						/*
						customEnrol.forEach((c) => {
							enroledText+="<br>"+c.split(/\s/)[0];
						});
						*/
						enroledText+="<br>+"+customEnrol.length;
					}

					let c;
					if (enroled < infos.min) {
						c="danger";
						if (enroled >= (infos.min/2)) {
							c="warning";
						}
					}else{
						c="success";
					}
					if (infos.min==0) {
						c="active";
					}
					tr.addClass(c);
					tr.append($("<td>").text(stall));
					tr.append($("<td>").html(infos.start+"h&nbsp;-&nbsp;"+infos.end+"h"));
					tr.append($("<td>").text(infos.description).css("white-space", "pre-line"));
					tr.append($("<td>").text(enroled+"/"+infos.min));
					
					tr.append($("<td>").html(enroledText));
					const td=$("<td>")
						  .append($("<button>").attr("title", "Modifier").addClass("edit connected admin btn btn-default btn-xs btn-warning").attr("day", day).attr("stall",stall).append($("<span>").addClass("glyphicon glyphicon-edit"))).addClass(c)
						  .append("&nbsp;")
						  .append($("<button>").attr("title", "Supprimer").addClass("delete connected admin btn btn-default btn-xs btn-danger").attr("day", day).attr("stall",stall).append($("<span>").addClass("glyphicon glyphicon-remove"))).addClass(c);

					if (currentUser && currentUser.uid && enrol[currentUser.uid]) {
						td.append("&nbsp;");
						td.append($("<button>").attr("title", "Se désinscrire").addClass("enrol connected btn btn-default btn-xs btn-success").attr("day", day).attr("stall",stall).append($("<span>").addClass("glyphicon glyphicon-minus"))).addClass(c);
					} else {
						td.append("&nbsp;");
						td.append($("<button>").attr("title", "S'inscrire").addClass("enrol connected btn btn-default btn-xs btn-success").attr("day", day).attr("stall",stall).append($("<span>").addClass("glyphicon glyphicon-plus"))).addClass(c);
					}
					tr.append(td);
					$("#planning-"+day).append(tr);
				}
			} else {
				console.log("Pas d'élément dans la page pour la journée "+day);
			}
		}
		checkConnected();
	});

	$("#planning").on("click", "button.enrol", (e) => {
		const day = $(e.target).closest("button").attr("day");
		const stall = $(e.target).closest("button").attr("stall");
		const infos = planning[day][stall];
		if (currentUser && currentUser.uid && currentProfile.pseudo) {
			if (! infos.enrol || ! infos.enrol[currentUser.uid]) {
				bootbox.prompt({
					title: "Voulez-vous vraiment vous inscrire pour le "+day+" de "+infos.start+"h à "+infos.end+"h ?",
					inputType: 'select',
					inputOptions: [
						{
							text: 'Je viens seul',
							value: '1',
						},
						{
							text: "Je viens avec quelqu'un pour aider",
							value: '2',
						},
						{
							text: 'Je viens avec 2 personnes pour aider',
							value: '3',
						},
						{
							text: 'Je viens avec 3 personnes pour aider',
							value: '4',
						},
						{
							text: 'Je viens avec 4 personnes pour aider',
							value: '5',
						},
						{
							text: 'Je viens avec 5 personnes pour aider',
							value: '6',
						}
					],
					callback: result => {
						if (result) {
							ref.child("kermesse").child(year).child("planning").child(day).child(stall).child("enrol").child(currentUser.uid).set(
								{
									'pseudo': currentProfile.pseudo,
									'number': result,
								},
								(error)=>{
									if (error) {
										alert(error);
									} else {
										logAction("planning", "subscribe", day+":"+stall);
									}
								});
							
						}
					}
				});
			} else {
				bootbox.confirm("Voulez-vous vraiment vous désinscrire pour le "+day+" de "+infos.start+"h à "+infos.end+"h ?", result =>{
					if (result) {
						ref.child("kermesse").child(year).child("planning").child(day).child(stall).child("enrol").child(currentUser.uid).remove(
							(error)=>{
								if (error) {
									alert(error);
								} else {
									logAction("planning", "unsubscribe", day+":"+stall);
								}
							});
					}
				});
			}
		}
	});

	$("#planning").on("click", "button.edit", (e) => {
		const day = $(e.target).closest("button").attr("day");
		const stall = $(e.target).closest("button").attr("stall");
		const infos = planning[day][stall];
		
		$("#edit-stall-error").hide();
		$("#edit-stall-name").attr("day", day).attr("stall", stall).val(stall).removeAttr("disabled");//.attr("disabled", "disabled");
		$("#edit-stall-where").val(infos.where);
		$("#edit-stall-min").val(infos.min);
		$("#edit-stall-force-enroled").val(infos.customEnrol || "");
		$("#edit-stall-start").val(infos.start);
		$("#edit-stall-end").val(infos.end);
		let enroledText="";
		const enrol = infos.enrol || {};
		$("#edit-stall-already-enrols").empty();
		for (uid in enrol) {
			let userInfos = enrol[uid];
			let pseudo = enrol[uid];
			if (typeof userInfos == 'object') {
				pseudo = userInfos.pseudo;
				if (userInfos.number>1) {
					userInfos = userInfos.pseudo+" +"+(userInfos.number-1);
				} else {
					userInfos = userInfos.pseudo;
				}
			}
			if (users && users[uid]) {
				userInfos = users[uid].firstname+" "+users[uid].lastname+" "+users[uid].email+" "+users[uid].mobile;
				if (typeof enrol[uid] == 'object' && enrol[uid].number>1) {
					if (enrol[uid].number>1) {
						userInfos += " +"+(enrol[uid].number-1);
					}
				}
			}
			let enroled = $("<span>").attr("data-toggle", "tooltip").attr("title", pseudo).attr("id", "enrol-"+uid).addClass("label label-default")
				.append($("<span>").text(userInfos))
				.append("&nbsp;")
				.append($("<span>").attr("day", day).attr("stall", stall).attr("pseudo", pseudo).attr("uid", uid).addClass("uid glyphicon glyphicon-remove"));
			$("#edit-stall-already-enrols").append(enroled);
		}

		$("#edit-stall-description").val(infos.description);
		//stallMDE.value(infos.description);
		$("#edit-stall").modal("show");
	});

	$("#edit-stall").on("click", "span.uid", (e) => {
		const uid = $(e.target).attr("uid");
		const pseudo = $(e.target).attr("pseudo");
		const day = $(e.target).attr("day");
		const stall = $(e.target).attr("stall");
		bootbox.confirm("Voulez-vous vraiment désinscrire "+pseudo+" ?", result =>{
			if (result) {
				ref.child("kermesse").child(year).child("planning").child(day).child(stall).child("enrol").child(uid).remove((error)=>{
					if (!error) {
						logAction("planning", "unsubscribe", day+":"+stall+":"+pseudo, {uid: uid});
						$("#enrol-"+uid).remove();
					}
				});
			}
		});
		
	});
	
	$("#planning").on("click", "button.delete", (e) => {
		const day = $(e.target).closest("button").attr("day");
		const stall = $(e.target).closest("button").attr("stall");
		bootbox.confirm("Voulez-vous vraiment supprimer cette entrée ?", result =>{
			if (result) {
				const d=ref.child("kermesse").child(year).child("planning").child(day).child(stall).remove();
				logAction("planning", "remove", day+":"+stall, d);
			}
		});
	});
	
	$(".add-stall").on("click", (e) => {
		const day = $(e.target).attr("day");
		$("#edit-stall-error").hide();

		$("#edit-stall-name").attr("day", day).val("").removeAttr("disabled", "disabled");
		$("#edit-stall-name").removeAttr("stall");
		$("#edit-stall-where").val("");
		$("#edit-stall-min").val(4);
		$("#edit-stall-start").val(14);
		$("#edit-stall-end").val(18);
		$("#edit-stall-description").val("");
		$("#edit-stall-force-enroled").val("");
		$("#edit-stall-already-enrols").empty();

		//stallMDE.value("");
		$("#edit-stall").modal("show");
	});

	$("#edit-stall-save").on("click", (e) => {
		const stall = $("#edit-stall-name").val();
		const originalStall = $("#edit-stall-name").attr("stall");
		const day = $("#edit-stall-name").attr("day");
		
		if (! stall) {
			$("#edit-stall-error").text("Merci de donner un nom à la rubrique").show();
		} else {
			const infos = {
				where: $("#edit-stall-where").val(),
				min: $("#edit-stall-min").val(),
				start: $("#edit-stall-start").val(),
				end: $("#edit-stall-end").val(),
				customEnrol: $("#edit-stall-force-enroled").val(),
				description: $("#edit-stall-description").val() //stallMDE.value()
			};
			let enrol={};
			if (planning[day][stall] && planning[day][stall].enrol) {
				enrol=planning[day][stall].enrol;
			}
			if (planning[day][originalStall] && originalStall != stall) {
				//console.log("rename", originalStall, stall);
				enrol=planning[day][originalStall].enrol || {};
				const d=ref.child("kermesse").child(year).child("planning").child(day).child(originalStall).remove();
				logAction("planning", "remove", day+":"+stall, d);
			}
			infos.enrol = enrol;
			//console.log(infos);
			ref.child("kermesse").child(year).child("planning").child(day).child(stall).set(
				infos,
				(error) => {
					if (error) {
						$("#edit-stall-error").text(error).show();
					} else {
						if (originalStall) {
							logAction("planning", "edit", day+":"+stall, infos);
						} else {
							logAction("planning", "create", day+":"+stall, infos);
						}
						$("#edit-stall").modal("hide");
					}
				}
			);
		}
	});
	
	ref.child("kermesse").child(year).child("todo").on("value", (snapshot) => {
		todos = snapshot.val();
		$("#todo").empty();
		let total_actions = 0;
		let done_actions = 0;
		for (let group in todos) {
			let first_tr;
			let actions=0;
			for (let action in todos[group]) {
				const infos = todos[group][action];
				const tr = $("<tr>");
				let c = infos.done ? "success" : "warning";
				if (infos.done) {
					done_actions++;
				} else if (! infos.who || ! infos.progression) {
					c = "danger";
				}
				total_actions++;
				if (actions===0) {
					first_tr=tr;
					tr.append(
						$("<td>")
							.append($("<span>").text(group+" "))
							.append($("<button>").attr("title", "Ajouter une action").addClass("add connected admin btn btn-default btn-xs").attr("group", group).append($("<span>").addClass("glyphicon glyphicon-plus"))));
				};
				tr.append($("<td>").text(action).addClass(c));
				tr.append($("<td>").text(infos.who).addClass(c));
				tr.append($("<td>").text(infos.progression).css("white-space", "pre-line").addClass(c));
				tr.append($("<td>")
						  .append($("<button>").attr("title", "Modifier l'action").addClass("edit connected admin btn btn-default btn-xs btn-warning").attr("group", group).attr("action",action).append($("<span>").addClass("glyphicon glyphicon-edit"))).addClass(c)
						  .append("&nbsp;")
						  .append($("<button>").attr("title", "Supprimer l'action").addClass("delete connected admin btn btn-default btn-xs btn-danger").attr("group", group).attr("action",action).append($("<span>").addClass("glyphicon glyphicon-remove"))).addClass(c));
				$("#todo").append(tr);
				actions++;
			}
			first_tr.find("td").first().attr('rowspan', actions);
		}
		checkConnected();
		$("#todo-done").text(done_actions);
		$("#todo-todo").text(total_actions);
	});
	
	$("#edit-todo-save").on("click", (e) => {
		const group = $("#edit-group-name").val();
		const action = $("#edit-action-name").val();
		const originalAction = $("#edit-action-name").attr("action");
		
		const progression = $("#edit-progression").val(); //todoMDE.value();
		const done = $('#edit-action-done').prop('checked');
		const who = $("#edit-who").val();

		if (!group) {
			$("#edit-todo-error").text("Merci de donner un nom à la rubrique").show();
		} else if (!action) {
			$("#edit-todo-error").text("Merci de renseigner le nom de l'action").show();
		} else {
			//console.log("save", group, action, progression, done);
			
			if (originalAction && todos[group][originalAction] && originalAction != action) {
				//console.log("rename", originalAction, action);
				const d = ref.child("kermesse").child(year).child("todo").child(group).child(originalAction).remove();
				logAction("todo", "remove", group+":"+originalAction, d);
			}
			const data = {
				progression: progression,
				done: done,
				who: who
			};
			ref.child("kermesse").child(year).child("todo").child(group).child(action).set(
				data,
				(error) => {
					if (error) {
						$("#edit-todo-error").text(error).show();
					} else {
						if (originalAction) {
							logAction("todo", "edit", group+":"+action, data);
						} else {
							logAction("todo", "create", group+":"+action, data);
						}
						$("#edit-todo").modal("hide");
					}
				}
			);
		}
	});
	
	$("#add-todo").on("click", (e) => {
		$("#edit-group-name").val("").removeAttr("disabled");
		$("#edit-action-name").val("").removeAttr("disabled");
		$("#edit-progression").val("");
		//todoMDE.value("");
		$('#edit-action-done').bootstrapToggle('off');
		$("#edit-todo").modal("show");
	});
	
	$("#todo").on("click", "button.add", (e) => {
		const group = $(e.target).closest("button").attr("group");
		$("#edit-todo-error").hide();
		$("#edit-group-name").val(group).removeAttr("disabled");
		$("#edit-action-name").val("").removeAttr("disabled");
		$("#edit-progression").val("");
		//todoMDE.value("");
		$("#edit-who").val("");
		$('#edit-action-done').bootstrapToggle('off');
		$("#edit-todo").modal("show");
	});

	$("#todo").on("click", "button.delete", (e) => {
		const group = $(e.target).closest("button").attr("group");
		const action = $(e.target).closest("button").attr("action");
		bootbox.confirm("Voulez-vous vraiment supprimer cette action ?", result =>{
			if (result) {
				const d=ref.child("kermesse").child(year).child("todo").child(group).child(action).remove();
				logAction("todo", "remove", group+":"+action, d);
			}
		});
	});
	
	$("#todo").on("click", "button.edit", (e) => {
		const group = $(e.target).closest("button").attr("group");
		const action = $(e.target).closest("button").attr("action");
		
		$("#edit-todo-error").hide();
		$("#edit-group-name").val(group).attr("disabled", "disabled");
		$("#edit-action-name").attr("action", action).val(action).removeAttr("disabled");
		$("#edit-progression").val(todos[group][action].progression);
		//todoMDE.value(todos[group][action].progression);
		$("#edit-who").val(todos[group][action].who);
		//console.log("done", todos[group][action].done);
		$('#edit-action-done').bootstrapToggle(todos[group][action].done ? 'on' : 'off');
		$("#edit-todo").modal("show");
	});
});
