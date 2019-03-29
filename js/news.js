$(function() {
	const newsMDE = new SimpleMDE({ element: $("#edit-news-content")[0], spellChecker: false });
	$("#edit-news").on('shown.bs.modal', () => {
		newsMDE.codemirror.refresh();
	});
	const mdConverter = new showdown.Converter();
		ref.child("news").on("child_removed", (snapshot) => {
		const id = snapshot.name();
		$("#"+id).remove();
		delete news[id];
		checkConnected();
	});

	ref.child("news").on("child_changed", (snapshot) => {
		const infos = snapshot.val();
		const id = snapshot.name();
		$("#"+id+" header>span").text(infos.title);
		$("#"+id+" p.content").html(mdConverter.makeHtml(infos.content));
		if (infos.signature) {
			$("#"+id+" p.signature").html(infos.signature.replace(/\n/g, "<br>"));
		}
		
		checkConnected();
	});

	ref.child("news").on("child_added", (snapshot) => {
		const infos = snapshot.val();
		const id = snapshot.name();
		news[id]=infos;
		const div = $("<article>").attr("id", id);
		div.append($("<header>")
				   .append($("<span>").text(infos.title))
				   .append("&nbsp;")
				   .append($("<button>").attr("news", id).addClass("edit connected admin btn btn-default btn-xs btn-warning").append($("<span>").addClass("glyphicon glyphicon-edit")))
				   .append("&nbsp;")
				   .append($("<button>").attr("news", id).addClass("delete connected admin btn btn-default btn-xs btn-danger").append($("<span>").addClass("glyphicon glyphicon-remove")))
				  );
		div.append($("<p>").addClass("content").html(mdConverter.makeHtml(infos.content)));
		const signature = infos.signature || "";
		div.append($("<p>").addClass("signature").html(signature.replace(/\n/g, "<br>")));
		$("#news").prepend(div);
		checkConnected();
	});
	
	$("#add-news").on("click", (e) => {
		$("#edit-news-title").removeAttr("disabled").attr("news", "").val("");
		newsMDE.value("");
		let signature = currentProfile.pseudo;
		if (currentProfile.activity) {
			signature+="\n"+currentProfile.activity;
		}
		$("#edit-news-signature").val(signature);
		$("#edit-news").modal("show");
	});

	$("#news").on("click", "button.delete", (e) => {
		const id = $(e.target).closest("button").attr("news");
		bootbox.confirm("Voulez-vous vraiment supprimer cette actualité ?", result =>{
			if (result) {
				const removed=ref.child("news").child(id).remove();
				logAction("news", "remove", removed.val().title, removed);
			}
		});
	});
	
	$("#news").on("click", "button.edit", (e) => {
		const id = $(e.target).closest("button").attr("news");
		if (news[id]) {
			$("#edit-news-title").attr("news", id).val(news[id].title);
			newsMDE.value(news[id].content);
			let signature="";
			if (news[id].signature) {
				signature=news[id].signature;
			} else {
				signature = currentProfile.pseudo;
				if (currentProfile.activity) {
					signature+="\n"+currentProfile.activity;
				}
			}
			$("#edit-news-signature").val(signature);
			$("#edit-news").modal("show");
		}
	});
	
	$("#edit-news-save").on("click", (e) => {
		const title = $("#edit-news-title").val();
		const content = newsMDE.value();
		const signature = $("#edit-news-signature").val();
		const oldId = $("#edit-news-title").attr("news");
		if (! title) {
			$("#edit-news-error").text("Merci de donner un titre").show();
		} else {
			const data = {
				title,
				content,
				signature,
				editedAt : Webcom.ServerValue.TIMESTAMP,
				editedBy: {
					uid: currentUser.uid,
					email: currentUser.providerUid,
					pseudo: currentProfile.pseudo
				}
			};
			if (oldId && news[oldId]) {
				ref.child("news").child(oldId).update(
					data, (error) => {
						if (error) {
							$("#edit-news-error").text(error).show();
						} else {
							logAction("news", "edit", title, data);
							$("#edit-news").modal("hide");
						}
					});
			} else {
				const id=ref.child("news").push(
					data, (error) => {
						if (error) {
							$("#edit-news-error").text(error).show();
						} else {
							logAction("news", "create", title, data);
							$("#edit-news").modal("hide");
						}
					});
			}
		}
	});
	
	
});
