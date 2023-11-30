<?php require_once '../../_includes.php'; ?>
<!DOCTYPE html>
<html lang="<?php echo $language_iso; ?>">
  <head>
    <?php include_once '../../_games_head.php'; ?>
    <title>Pew Pew</title>
  </head>

  <body>
    <canvas id="canvas" width="1200" height="800"></canvas>

    <button class="controls__toggler-button controls--open js-controls-toggler js-stop-propagation">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sliders"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
      <!-- <span>Controls</span> -->
    </button>
    <button class="controls__toggler-button controls--closed js-controls-toggler js-stop-propagation">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      <!-- <span>Close</span> -->
    </button>

    <div id="controls__panel" class="js-controls-toggler js-stop-propagation">
      <ul>
        <li>
          <svg width="22" height="32" viewBox="0 0 22 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="21" height="31" rx="10.5" stroke="currentColor"/>
            <path d="M10 15H5.00691C4.45463 15 4.00691 14.5523 4.00691 14V13.0333C4.00691 13.0111 4.00634 12.992 4.00529 12.9698C3.9823 12.4828 3.80705 6.23656 9.81646 4.30559C10.4173 4.11251 11 4.58892 11 5.22004V14C11 14.5523 10.5523 15 10 15Z" fill="currentColor"/>
          </svg>

          <p>
            <strong>Hold left click</strong>
            to aim and choose power
          </p>
        </li>
        <li>
          <svg width="22" height="32" viewBox="0 0 22 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="21" height="31" rx="10.5" stroke="currentColor"/>
            <path d="M10 15H5.00691C4.45463 15 4.00691 14.5523 4.00691 14V13.0333C4.00691 13.0111 4.00634 12.992 4.00529 12.9698C3.9823 12.4828 3.80705 6.23656 9.81646 4.30559C10.4173 4.11251 11 4.58892 11 5.22004V14C11 14.5523 10.5523 15 10 15Z" fill="currentColor" fill-opacity="0.22"/>
          </svg>

          <p>
            <strong>Release left click</strong>
            to fire
          </p>
        </li>
      </ul>

      <p><a href="#" class="controls__panel__link">Close</a></p>
    </div>

    <script src="<?php echo $js_path; ?>game.bundle.js"></script>
    <script src="./index.js"></script>
  </body>
</html>