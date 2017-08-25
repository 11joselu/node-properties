import '../sass/style.scss';
import {
  createItem,
  removeLoading,
  createLoadingComponent,
  createLink,
} from './modules/dom-utils';

$ (document).ready (() => {
  const socket = io ();
  const $info = $ ('#panel__info');
  console.log ();
  $info.append (
    createItem (
      'Worker information',
      'panel__info__item panel__info__item--mark'
    )
  );

  socket.on ('cmd start', msg => {
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

  $.ajax ('/clone')
    .then (response => {
      const $buttons = $ ('#buttons');
      $buttons.append (createLink (`/view/${response.data.id}`, 'View'));
      $buttons.append (createLink (`/edit/${response.data.id}`, 'Edit'));
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
