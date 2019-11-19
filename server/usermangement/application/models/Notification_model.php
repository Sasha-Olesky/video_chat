<?php defined('BASEPATH') OR exit('No direct script access allowed');
/**
* Name:  Notification Model
* 
* Author:  Paula Gomes
* Created:  9.22.2016 
* 
* Description:  push notification model ...
* 
*/

class Notification_model extends CI_Model {
	
	// fields
	var $notification_id;
	var $device_token;
	var $phone_type;
	var $date;
	
	function __construct() 
	{
		parent::__construct();
	}
	
	// get notification_id
	function get_id () 
	{
	    $notification_id = $this->db->select(array('notification_id'))
	              ->where(array('device_token' => $this->device_token))
	              ->get($this->my_conf->notification_tbl, 1)
	              ->result();
	    $this->notification_id = $notification_id[0]->notification_id; 

	    return $this->notification_id;
	}

	function insert_token($token_id, $phone_type = 0) {
		//check requests
		if($token_id == "")
			return false;
		
	    $this->device_token = $token_id;
	    $this->phone_type = $phone_type;


	    // duplicate device token check
	    $temp = array();
		$query = $this->db->where(array('device_token' => $this->device_token))
						  ->get($this->my_conf->notification_tbl);
		$temp = json_decode(json_encode($query->result()), true);
		if(count($temp))
	    	return true;

	    // insert device token
	    $result = $this->db->insert($this->my_conf->notification_tbl, array('device_token' => $this->device_token, 'phone_type' => $this->phone_type));
	    
	    if($result) {
	      	return true;
	    }

	    return false;
	}

	// send Push Notification to all devices
	function testing_notification() {
		// $temp = array();
		// $query = $this->db->select(array('device_token'))
		// 				  ->where(array('phone_type' => 0))
		// 				  ->get($this->my_conf->notification_tbl);
		// $temp = json_decode(json_encode($query->result()), true);
		// if(count($temp) == 0)
	 //    	return true;
	 //    foreach ($temp as $item) {
	    	// req
	    	// $device_token = $item['device_token'];
			// $device_token = "7db5b83eb4130a96ff844af9e9629aa8aef4095687ab1cdf83cb3fda0d4374fa";
			$device_token = "45E18FFA8C221DDFDD21CD201765084D31C6F8EE820137A0AB57303659D6DF0E";
			$device_token = strtolower($device_token);

			$message = "APNS Testing";
			$badge = 1;
			$body = array();
					if($message == "")
					{
						$body['aps'] = array();
					} else {
						$body['aps'] = array(
	        				            'alert' => $message,
	                    				'badge' => $badge,
	                    				'sound' => 'default'
		                     		);
					}
			// Encode the payload as JSON
			$payload = json_encode($body);

			$this->sendIOSNofication($device_token, $payload);

	    // }
	    return $device_token;
	}

	// APNS (iOS Push Notification)
	function sendIOSNofication($deviceToken = "", $payload) {
		//check requests 
		if($deviceToken == "")
			return false;
		
		// fake password:
		$passphrase = 'no_pass_phrase_yet';
   		////////////////////////////////////////////////////////////////////////////////

		$ctx = stream_context_create();
		stream_context_set_option($ctx, 'ssl', 'local_cert', 'ck_dist.pem');
		// stream_context_set_option($ctx, 'ssl', 'passphrase', '1234');

		// Open a connection to the APNS server
		$flag = 1;
		if ($flag == 1) {                   //developer
        	$fp = stream_socket_client('ssl://gateway.sandbox.push.apple.com:2195', $err,$errstr, 60, STREAM_CLIENT_CONNECT, $ctx);
      	} else {							//product
        	$fp = stream_socket_client('ssl://gateway.push.apple.com:2195', $err,$errstr, 60, STREAM_CLIENT_CONNECT, $ctx);
      	}
		if (!$fp)
			return false;

		// Build the binary notification
		$msg = chr(0) . pack('n', 32) . pack('H*', $deviceToken) . pack('n', strlen($payload)) . $payload;
		// Send it to the server
		$result = fwrite($fp, $msg, strlen($msg));
		// Close the connection to the server
		fclose($fp);

		if (!$result)
			return false;
		else
			return true;
	}


	// parse full fields value from array
  	function parse_values ($data = array())
  	{
    	if(array_key_exists('notification_id', $data)) 
      		$this->notification_id = $data['notification_id'];

      	if(array_key_exists('device_token', $data)) 
      		$this->v = $data['device_token'];

      	if(array_key_exists('phone_type', $data)) 
      		$this->phone_type = $data['phone_type'];

	}
}
