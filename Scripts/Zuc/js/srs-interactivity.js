$(document).ready(function(){

    function openModal(className){
        $(className.data.key).removeClass('non-visible');
    }
    function closeModal(className){
        $(className.data.key).addClass('non-visible');
    }

    let cross = $('.addItem-form').find('.purple-background h2');
    cross.bind('click',{key:'.addItem-modal'},closeModal);

    // Retailer Profile screen function for opening shipping location modal and closing
    $('.location-form-button').bind('click',{key:'.shipping-locations-modal'},openModal);
    //editing the shiiping location data. the form should populate with entered data
    $('.shipping-location-edit').bind('click',{key:'.shipping-locations-modal'},openModal);

    let shippingCross = $('.shipping-locations-form').find('.purple-background h2');

    shippingCross.bind('click',{key:'.shipping-locations-modal'},closeModal);

    //Contact form  

    $('.contact-form-button').bind('click',{key:'.contacts-form-modal'},openModal);
    let contactFormClose = $('.contacts-form').find('.purple-background h2');

    contactFormClose.bind('click',{key:'.contacts-form-modal'},closeModal);
    //Video link for plan registration
    $('.videoLink a').bind('click',{key:'.video-modal-container'},openModal);
    $('.video-modal .cross').bind('click',{key:'.video-modal-container'},closeModal);
    //addItem modal seriel info
    $('.serial-info').click(function(){
        $('.serial-text-container').toggle(500);
    });

    $('.three-grid-column .video-box').click(function () {
        // console.log($(this).find('p').text());

        $('.as-video').removeClass('non-visible');
        $('.modal-video').empty();
        let videoModal = $('.as-video-modal');
        let title = $(this).find('p').text();
        videoModal.find('h2').text(title);
        let videoLink = $(this).find('.video-link').text();
        $('.modal-video').append('<source src="' + videoLink + '" type="video/mp4">');


    });

    $('.as-video-modal .close-modal').click(function () {
        $('.as-video').addClass('non-visible');
        let vid = document.getElementById('clicked-video');
        vid.load();
        $('.modal-video').empty();

    });

});