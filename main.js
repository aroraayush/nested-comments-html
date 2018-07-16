var comments = new Array(); // This array will contain all the comments

class Comment { //  Class declared
	
	constructor(id, name, handle, content, upvotes, downvotes, parentId) {
		this.id = id;
		this.name = name;
		this.handle = handle;
		this.content = content;
		this.lastUpdated = new Date();
		this.upvotes = upvotes;
		this.downvotes = downvotes;
		this.childrenIds = [];
		this.parentId = parentId;
	}

	static toJSONString(comment) { // created JSON string to send/save on server
		return `
			{
				"id" : "${comment.id}",
				"name" : "${comment.name}",
				"handle" : "${comment.handle}",
				"content" : "${comment.content}",
				"upvotes" : "${comment.upvotes}",
				"downvotes" : "${comment.downvotes}",
				"lastUpdated": "${comment.lastUpdated}",
				"parentId": "${comment.parentId}",
				"childrenIds": "${JSON.stringify(comment.childrenIds)}"
			}`;
  	}
}

getComments(); // Fetch comments(if exists) before page load

function persistComments() { // storing date in browser's local storage
	var val = "[";		// creating the string that will be persisted in the local storage
	for(var i in comments) {
		val += Comment.toJSONString(comments[i]);
		(i != comments.length - 1) ? val += "," : val += "";
	}
	val += "]";
	localStorage.setItem('comments', val);
}

function getComments() { // Fetching the comments from storage, if they exist
	var commentsStr = localStorage.getItem("comments");
	if(commentsStr != null) {
		comments = JSON.parse(commentsStr); // converting the string back to Object, to use the data
		for(var i=0; i<comments.length; i++) {
			comments[i].lastUpdated = new Date(comments[i].lastUpdated); // converting to Date Object
			comments[i].upvotes = parseInt(comments[i].upvotes);	// Converting string to Int
			comments[i].downvotes = parseInt(comments[i].downvotes); // Converting string to Int
			comments[i].childrenIds = JSON.parse(comments[i].childrenIds); // converting string back to array form
		}
	}
}

function renderComment(comment) { // Rendering individual comment whether parent comment or child/reply comment
	var id = comment.id;

	var listElem = `
			<div class="hr"><hr/></div>
			<li id="comment-${id}" style="max-width:600px;">
		 	<div class="comment-header">
				<div  class="comment-handle">
					${comment.handle}
				</div>
				<div style="color:rgba(0,0,0,0.3);margin-top:20px;">
					posted ${timeAgo(comment.lastUpdated)}
				</div>
			</div> 
			<div>
			 ${comment.content}
			</div>
			
			<div>
				${comment.upvotes} <a href="#" role="button" id="upvotes-${id}">Upvotes</a>
				${comment.downvotes} <a href="#" role="button" id="downvotes-${id}">Downvote</a>
				<a href="#" role="button" id="reply-${id}">Reply</a>
			</div>`;
	
	if(comment.childrenIds.length != 0) {
		listElem += `<ul id="childlist-${id}">`;
		comment.childrenIds.forEach(function (commentId) {
			listElem += renderComment(comments[commentId]);
		});
		listElem += "</ul>";
	}		
	listElem += "</li>";
	return listElem;
}

function renderComments() { // Function created to pass parent comment from rootComments to renderComment
	var rootComments = [];
	comments.forEach(function (comment) {
		if(comment.parentId == null || comment.parentId == "null") {
			rootComments.push(comment);
		}
	});

	let commentList = '';
	rootComments.forEach(function (comment) {
		commentList += renderComment(comment);
	});
	document.getElementById("commentsList").innerHTML = commentList;
}

function addComment(name, handle, content, parent) { // adding a new comment to memory and UI
	let comment = new Comment(comments.length, name,handle,content,0,0, parent);
	comments.push(comment);
	if(parent != null) {
		comments[parent].childrenIds.push(comments.length-1);
	} 
	persistComments();
	renderComments();
}

function timeAgo(date){
	var currentDate = new Date();
	var yearDiff = currentDate.getFullYear() - date.getFullYear();

	if(yearDiff>0)
		return `${yearDiff} year${yearDiff==1? "":"s"} ago`;
	
	var monthDiff = currentDate.getMonth() - date.getMonth();
	if(monthDiff>0)
		return `${monthDiff} month${monthDiff == 1 ? "" : "s"} ago`;
	
	var dateDiff = currentDate.getDate() - date.getDate();
	if (dateDiff > 0)
		return `${dateDiff} day${dateDiff == 1 ? "" : "s"} ago`;
	
	var hourDiff = currentDate.getHours() - date.getHours();
	if (hourDiff > 0)
		return `${hourDiff} hour${hourDiff == 1 ? "" : "s"} ago`;

	var minuteDiff = currentDate.getMinutes() - date.getMinutes();
	if (minuteDiff > 0)
		return `${minuteDiff} minute${minuteDiff == 1 ? "" : "s"} ago`;
	return `a few seconds ago`;
}

document.addEventListener('DOMContentLoaded', function (params) {
	renderComments();

	const addButton = document.getElementById("add-comment");	
	addButton.addEventListener("click", function() {
		let name = document.getElementById("name").value;
		let handle = document.getElementById("handle").value;
		let content = document.getElementById("comment").value;
		addComment(name, handle, content, null);
	}, false);

	const commentsList = document.getElementById("commentsList");
	commentsList.addEventListener("click", function(event) {
		var parts = event.target.id.split("-");
		var type = parts[0];
		var id = parts[parts.length-1];
		var abc = event.target.id.split("reply-")[1]; 
		if(type == 'reply') {
			var inputElem = `
				<li id="input-${abc}">
				<div class="comment-input-row">
					<div>
						<input type="text" placeholder="Name" id="name-${abc}" class="name-handle" />
					</div>
					<div>
						<input type="text" placeholder="handle" id="handle-${abc}" class="name-handle" />
					</div>
				</div>
				<div>
					<textarea rows="5" id="content-${abc}" class="comment-box" placeholder="Your reply...."></textarea>
					<div>
						<button id="addreply-${abc}" class="add-btn">Submit</button>
					</div>
				</div>
				</li>
				`;

			var childListElemId = `childlist-${event.target.id.split("reply-")[1]}`;
			var childListElem = document.getElementById(childListElemId);
			
			if(childListElem == null) {
				childListElem = `<ul id="childlist-${event.target.id.split("reply-")[1]}"> ${inputElem} </ul>`;
				document.getElementById(`comment-${abc}`).innerHTML += childListElem;								
			} else {
				childListElem.innerHTML = inputElem + childListElem.innerHTML;
			}
		} else if(type == 'addreply') {
			var content = document.getElementById(`content-${abc}`).value;
			var name = document.getElementById(`name-${abc}`).value;
			var handle = document.getElementById(`handle-${abc}`).value;
			addComment(name, handle, content, id);
		} else if(type == 'upvotes' || type == 'downvotes') {
			comments[id][type]++;
			renderComments();
			persistComments();
		}
	}, false);

},false);

