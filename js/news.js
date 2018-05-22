$(function() {
	const newsMDE = new SimpleMDE({ element: $("#edit-news-content")[0], spellChecker: false });
	$("#edit-news").on('shown.bs.modal', () => {
		newsMDE.codemirror.refresh();
	});
	const mdConverter = new showdown.Converter();
		ref.child("kermesse").child("news").on("child_removed", (snapshot) => {
		const id = snapshot.name();
		$("#"+id).remove();
		delete news[id];
		checkConnected();
	});

	ref.child("kermesse").child("news").on("child_changed", (snapshot) => {
		const infos = snapshot.val();
		const id = snapshot.name();
		$("#"+id+" header>span").text(infos.title);
		$("#"+id+" p").html(mdConverter.makeHtml(infos.content));
		checkConnected();
	});

	ref.child("kermesse").child("news").on("child_added", (snapshot) => {
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
		div.append($("<p>").html(mdConverter.makeHtml(infos.content)));
		$("#news").prepend(div);
		checkConnected();
	});
	
	$("#add-news").on("click", (e) => {
		$("#edit-news-title").removeAttr("disabled").attr("news", "").val("");
		newsMDE.value("");
		$("#edit-news").modal("show");
	});

	$("#news").on("click", "button.delete", (e) => {
		const id = $(e.target).attr("news");
		bootbox.confirm("Voulez-vous vraiment supprimer cette actualité ?", result =>{
			if (result) {
				ref.child("kermesse").child("news").child(id).remove();
			}
		});
	});
	
	$("#news").on("click", "button.edit", (e) => {
		const id = $(e.target).attr("news");
		if (news[id]) {
			$("#edit-news-title").attr("news", id).val(news[id].title);
			newsMDE.value(news[id].content);
			$("#edit-news").modal("show");
		}
	});
	
	$("#edit-news-save").on("click", (e) => {
		const title = $("#edit-news-title").val();
		const content = newsMDE.value();
		const oldId = $("#edit-news-title").attr("news");
		if (! title) {
			$("#edit-news-error").text("Merci de donner un titre").show();
		} else {
			if (oldId && news[oldId]) {
				ref.child("kermesse").child("news").child(oldId).update({
					title: title,
					content: content,
					editedAt : Webcom.ServerValue.TIMESTAMP
				}, (error) => {
					if (error) {
						$("#edit-news-error").text(error).show();
					} else {
						$("#edit-news").modal("hide");
					}
				});
			} else {
				ref.child("kermesse").child("news").push({
					title: title,
					content: content,
					createdAt : Webcom.ServerValue.TIMESTAMP
				}, (error) => {
					if (error) {
						$("#edit-news-error").text(error).show();
					} else {
						$("#edit-news").modal("hide");
					}
				});
			}
		}
	});
	
	
});
