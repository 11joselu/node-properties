import '../sass/style.scss';
import {
  createItem,
  removeLoading,
  createLoadingComponent,
  createLink,
} from './modules/dom-utils';
import * as axios from 'axios';

$ (document).ready (() => {
  let numberErrors = 0;
  const socket = io ();
  const pageData = {};

  const setUserValue = (num, userID) => {
    $('#js-users').text(num)
  
    if (num >= 2) {
      $('#js-users').addClass('message--error');
      $('#js--message').text('Too much users connected, could break yours changes. ' + pageData.userID)
        .addClass('message--error');
      
      if (userID === pageData.userID) {
        hideButtons();
      }
  
    } else {
      $('#js-users').removeClass('message--error');
      $('#js--message').text('users connected ' + pageData.userID)
        .removeClass('message--error');
      showButtons();
    }

  }
  
  const hideButtons = () => {
    $('#button-load').hide();
    $('#buttons').hide();
  }
  
  const showButtons = () => {
    $('#button-load').show();
    $('#buttons').show();
  }

  $ ('.panel__info').hide ();
  const $info = $ ('#panel__info');

  socket.on ('cmd start', msg => {
    $ ('.panel__info__worker ').remove ();
    $ ('.panel').removeClass ('panel--hidden');
    $('#panel__info').empty();
    
    $ ('.panel__info').show ();
    $info.append (
      createItem (
        'Worker information',
        'panel__info__item panel__info__item--mark'
      )
    );
    $info.append (createItem (`$ ${msg}`));
    $info.append (createLoadingComponent ());
  });

  socket.on ('cmd task', msg => {
    removeLoading ();
    $info.append (createItem (`$ ${msg}`));
    $info.append (createLoadingComponent ());
  });

  socket.on ('cmd pending', msg => {
    removeLoading ();
    $info.append (
      createItem (`${msg}`, 'panel__info__item panel__info__item--mark')
    );
    $info.append (createLoadingComponent ());
  });

  socket.on ('cmd message', msg => {
    removeLoading ();
    $info.append (
      createItem (`${msg}`, 'panel__info__item panel__info__item--message')
    );
  });

  socket.on ('cmd end', msg => {
    removeLoading ();
    $info.append (
      createItem (`${msg}`, 'panel__info__item panel__info__item--success')
    );
  });

  socket.on ('cmd error', msg => {
    removeLoading ();
    $info.append (
      createItem (`${msg}`, 'panel__info__item panel__info__item--error')
    );
  });

  socket.on('users', (numberUser, userID) => {
    pageData.users = numberUser;

    if (!('userID' in pageData)) {
      pageData.userID = userID;
    }

    setUserValue(numberUser, userID);
  });

  $('#js-checkbox').append(`
    <input type="checkbox" id="check" name="check" value="" class="checkbox" checked/>
    <label for="check" class="label">
      <span></span> Show only new attributes
    </label>
  `);

  $('#check').on('change', function() {
    if ($(this).is(':checked')) {
      $('.edit__panel').each((index, item) => {
        if (!$(item).hasClass('edit__panel--new')) {
          $(item).addClass('hidden');
        }
      });
    } else {
      $('.edit__panel').each((index, item) => {
        $(item).removeClass('hidden');
      });
    }

  });

  $ ('#button-load').on ('click', () => {
    $.get ('/clone')
      .then (response => {
        const $buttons = $ ('#buttons');
        $ (this).remove ();
        //$buttons.append (createLink (`/view/${response.data.id}`, 'View'));
        $buttons.append (createLink (`/edit/${response.data.id}`, 'Go to edit page'));
      })
      .catch (() => {
        removeLoading ();
        $info.append (
          createItem (
            '$ git clone error',
            'panel__info__item panel__info__item--error'
          )
        );
      });
  });

  $('#edit__form').removeClass('panel--hidden');
  $('#loading--edit').remove();
  
  $ ('#edit__form').on ('submit', function (evt) {
    evt.preventDefault ();
    $ (this).hide ();
    const data = {};

    $(this).serializeArray().forEach(function(x){
      data[x.name] = x.value;
    });

    axios.post('/edit/values', data)
    .then(() => {
      numberErrors = 0;
    })
    .catch((e) => {
      const $panelInfo = $('#panel__info');
      $panelInfo.empty();
      numberErrors++;
      
      if (numberErrors < 5) {
        $panelInfo.append('<li class="edit--error--message">An error ocurred. Please try again later</li>');
      } else {
        $panelInfo.append('<li class="edit--error--message">Something went wrong. Contact to the administrator</li>')
      }

      $panelInfo.append(`<li class="edit--error--message">${e.response.data.message}</li>`);
      $ (this).show ();
    })
  });
});
