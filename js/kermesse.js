$(function() {
	let todos;
	let planning;
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
	
	ref.child("kermesse").child("planning").on("value", (snapshot) => {
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
					const enroled = Object.keys(enrol).length+customEnrol.length;
					//console.log(day, stall, enrol);
					let c;
					if (enroled < infos.min) {
						c="danger";
						if (enroled >= (infos.min/2)) {
							c="warning";
						}
					}else{
						c="success";
					}
					
					tr.addClass(c);
					tr.append($("<td>").text(stall));
					tr.append($("<td>").html(infos.start+"h&nbsp;-&nbsp;"+infos.end+"h"));
					tr.append($("<td>").text(infos.where));
					tr.append($("<td>").text(infos.description).css("white-space", "pre"));
					tr.append($("<td>").text(enroled+"/"+infos.min));
					let enroledText=Object.values(enrol).join('<br>');
					if (customEnrol.length>0) {
						enroledText+="<br>+"+customEnrol.length;
					}
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
		const day = $(e.target).attr("day");
		const stall = $(e.target).attr("stall");
		const infos = planning[day][stall];
		if (currentUser && currentUser.uid && currentProfile.pseudo) {
			if (! infos.enrol || ! infos.enrol[currentUser.uid]) {
				bootbox.confirm("Voulez-vous vraiment vous inscrire pour le "+day+" de "+infos.start+"h à "+infos.end+"h ?", result =>{
					if (result) {
						ref.child("kermesse").child("planning").child(day).child(stall).child("enrol").child(currentUser.uid).set(
							currentProfile.pseudo,
							(error)=>{
								if (error) {
									alert(error);
								} else {
									
								}
							});
					}
				});
			} else {
				bootbox.confirm("Voulez-vous vraiment vous désinscrire pour le "+day+" de "+infos.start+"h à "+infos.end+"h ?", result =>{
					if (result) {
						ref.child("kermesse").child("planning").child(day).child(stall).child("enrol").child(currentUser.uid).remove(
							(error)=>{
								if (error) {
									alert(error);
								} else {
									
								}
							});
					}
				});
			}
		}
	});

	$("#planning").on("click", "button.edit", (e) => {
		const day = $(e.target).attr("day");
		const stall = $(e.target).attr("stall");
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
			if (users && users[uid]) {
				userInfos = users[uid].firstname+" "+users[uid].lastname+" "+users[uid].email+" "+users[uid].mobile;
			}
			let enroled = $("<span>").attr("data-toggle", "tooltip").attr("title", enrol[uid]).attr("id", "enrol-"+uid).addClass("label label-default")
				.append($("<span>").text(userInfos))
				.append("&nbsp;")
				.append($("<span>").attr("day", day).attr("stall", stall).attr("pseudo", enrol[uid]).attr("uid", uid).addClass("uid glyphicon glyphicon-remove"));
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
				ref.child("kermesse").child("planning").child(day).child(stall).child("enrol").child(uid).remove((error)=>{
					if (!error) {
						$("#enrol-"+uid).remove();
					}
				});
			}
		});
		
	});
	

	$("#planning").on("click", "button.delete", (e) => {
		const day = $(e.target).attr("day");
		const stall = $(e.target).attr("stall");
		bootbox.confirm("Voulez-vous vraiment supprimer cette entrée ?", result =>{
			if (result) {
				ref.child("kermesse").child("planning").child(day).child(stall).remove();
			}
		});
	});
	
	$(".add-stall").on("click", (e) => {
		const day = $(e.target).attr("day");
		$("#edit-stall-error").hide();

		$("#edit-stall-name").attr("day", day).val("").removeAttr("disabled", "disabled");
		$("#edit-stall-where").val("");
		$("#edit-stall-min").val(4);
		$("#edit-stall-start").val(14);
		$("#edit-stall-end").val(18);
		$("#edit-stall-description").val("");
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
				enrol=planning[day][originalStall].enrol;
				ref.child("kermesse").child("planning").child(day).child(originalStall).remove();
			}
			infos.enrol = enrol;
			//console.log(infos);
			ref.child("kermesse").child("planning").child(day).child(stall).set(
				infos,
				(error) => {
					if (error) {
						$("#edit-stall-error").text(error).show();
					} else {
						$("#edit-stall").modal("hide");
					}
				}
			);
		}
	});
	
	ref.child("kermesse").child("todo").on("value", (snapshot) => {
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
				tr.append($("<td>").text(infos.progression).css("white-space", "pre").addClass(c));
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
				ref.child("kermesse").child("todo").child(group).child(originalAction).remove();
			}
			
			ref.child("kermesse").child("todo").child(group).child(action).set(
				{
					progression: progression,
					done: done,
					who: who
				},
				(error) => {
					if (error) {
						$("#edit-todo-error").text(error).show();
					} else {
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
		const group = $(e.target).attr("group");
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
		const group = $(e.target).attr("group");
		const action = $(e.target).attr("action");
		bootbox.confirm("Voulez-vous vraiment supprimer cette action ?", result =>{
			if (result) {
				ref.child("kermesse").child("todo").child(group).child(action).remove();
			}
		});
	});
	
	$("#todo").on("click", "button.edit", (e) => {
		const group = $(e.target).attr("group");
		const action = $(e.target).attr("action");
		
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
