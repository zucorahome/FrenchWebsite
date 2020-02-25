$(document).ready(function(){
// console.log('dom called');
let currentPath = window.location.pathname;
if(currentPath.indexOf('smarterpartner')>0){
  playVideo();
}

function playVideo(){
  $('.video-box').click(function(){
    $('.video-modal-container').removeClass('non-visible');
    let mainVideoClass = $('.video-modal');
    let videoTag = $('.modal-video');
    videoTag.empty();
    let title = $(this).find('p').text();
    mainVideoClass.find('h2').text(title);
    let videoLink = $(this).find('.video-link').text();
    $('.modal-video').append('<source src="'+videoLink+'" type="video/mp4">');
  });
}

$('.video-modal .close-modal').click(function(){
  // console.log('should close it');
    $('.video-modal-container').addClass('non-visible');
    let vid = document.getElementById('clicked-video');
  	vid.load();
  	$('.modal-video').empty();
  });

}); //main document ends
