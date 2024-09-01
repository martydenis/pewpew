<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet" media="screen">
        <link rel="icon" type="image/svg" href="../martindenis/favicon.svg" />
        <link rel="stylesheet" type="text/css" href="./sandbox-utils/style.css" media="screen" />
        <link rel="stylesheet" type="text/css" href="./index.css" media="screen" />
        <title>Pew Pew</title>
    </head>

    <body>
        <canvas id="canvas" width="1200" height="800"></canvas>

        <button class="controls__toggler-button controls--open js-controls-toggler js-stop-propagation">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-help-circle">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        </button>
        <button class="controls__toggler-button controls--closed js-controls-toggler js-stop-propagation">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <!-- <span>Close</span> -->
        </button>

        <div id="controls__panel" class="js-controls-toggler js-stop-propagation">
            <ul>
                <li>
                    <svg width="22" height="32" viewBox="0 0 22 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.75" y="0.75" width="20.5" height="30.5" rx="10.25" stroke="currentColor" stroke-width="1.5" />
                        <path d="M10 15H5.00691C4.45463 15 4.00691 14.5523 4.00691 14V13.0333C4.00691 13.0111 4.00634 12.992 4.00529 12.9698C3.9823 12.4828 3.80705 6.23656 9.81646 4.30559C10.4173 4.11251 11 4.58892 11 5.22004V14C11 14.5523 10.5523 15 10 15Z" fill="currentColor" />
                    </svg>

                    <p>
                        <strong>Hold left click</strong>
                        to aim and choose power
                    </p>
                </li>
                <li>
                    <svg width="22" height="32" viewBox="0 0 22 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.75" y="0.75" width="20.5" height="30.5" rx="10.25" stroke="currentColor" stroke-width="1.5" />
                        <path d="M10 15H5.00691C4.45463 15 4.00691 14.5523 4.00691 14V13.0333C4.00691 13.0111 4.00634 12.992 4.00529 12.9698C3.9823 12.4828 3.80705 6.23656 9.81646 4.30559C10.4173 4.11251 11 4.58892 11 5.22004V14C11 14.5523 10.5523 15 10 15Z" fill="currentColor" fill-opacity="0.22" />
                    </svg>

                    <p>
                        <strong>Release left click</strong>
                        to fire
                    </p>
                </li>
                <li>
                    <svg width="22" height="32" viewBox="0 0 22 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.75" y="0.75" width="20.5" height="30.5" rx="10.25" stroke="currentColor" stroke-width="1.5" />
                        <path d="M12 15H16.9931C17.5454 15 17.9931 14.5523 17.9931 14V13.0333C17.9931 13.0111 17.9937 12.992 17.9947 12.9698C18.0177 12.4828 18.193 6.23656 12.1835 4.30559C11.5827 4.11251 11 4.58892 11 5.22004V14C11 14.5523 11.4477 15 12 15Z" fill="currentColor" />
                    </svg>

                    <p>
                        <strong>Right click</strong>
                        to teleport
                    </p>
                </li>
            </ul>

            <p><a href="#" class="controls__panel__link">Close</a></p>
        </div>

        <script type="module" src="./index.js"></script>
    </body>
</html>
