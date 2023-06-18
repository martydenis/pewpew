<?php require_once '../../_includes.php'; ?>
<!DOCTYPE html>
<html lang="<?php echo $language_iso; ?>">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <link rel="icon" type="image/svg" href="<?php echo $favicon_path; ?>favicon.svg" />
    <link rel="stylesheet" type="text/css" href="<?php echo $css_path; ?>game.css" media="screen" />
    <link rel="stylesheet" type="text/css" href="./index.css" media="screen" />
    <title>Pew Pew</title>
  </head>

  <body>
    <a href="<?php echo $sandbox_path; ?>" id="back">Back</a>
    <canvas id="canvas" width="1200" height="800"></canvas>

    <script src="<?php echo $js_path; ?>game.bundle.js"></script>
    <script src="./index.js"></script>
  </body>
</html>