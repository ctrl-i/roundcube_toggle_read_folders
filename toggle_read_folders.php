<?php
/**
 * Toggle visibility of folders with only read messages
 *
 * This plugin hides any folders that only has read messages in it.
 *
 * @version 0.1
 *
 */

class toggle_read_folders extends rcube_plugin
{
  public $task = 'mail';

  function init(){
    $this->include_script('toggle_read_folders.js');
  }
}
