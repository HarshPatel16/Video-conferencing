$('.edit-icon').click(function (e) {
    $('#image').click();
  });
  function fasterPreview(uploader) {
    if (uploader.files && uploader.files[0]) {
      $('#profileImage').attr('src', window.URL.createObjectURL(uploader.files[0]));
    }
  }
  $('#image').change(function () {
    fasterPreview(this);
  });
  $('.cancel').click(function () {
    $('#profileImage').attr('src', 'https://freesvg.org/img/abstract-user-flat-4.png');
  });

