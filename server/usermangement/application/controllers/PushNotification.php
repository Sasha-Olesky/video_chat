<?php defined('BASEPATH') OR exit('No direct script access allowed');
/**
* Name:  Push Notification Controller
* 
* Author:  Paula Gomes
* Created:  9.22.2016 
* 
* Description:  push notification.
* 
*/
class PushNotification extends CI_Controller {

    private $result;
	function __construct()
	{
		parent::__construct();

		$this->load->model("notification_model");
		$this->token_model = new Notification_model();
	}
	
	// testing send Push Notification ios
	function test_ios_notification () {
		
		$device_token  = $this->token_model->testing_notification();
		//response
		$response = array("result_code" => true, "result_data" => array("result" => $device_token));
		// print response
		$this->output->set_content_type('application/json')->set_output(json_encode($response));
	}

	// save device token in database
    function insert_token() {
    	// parsing request
        $data = json_decode(file_get_contents('php://input'),true);

		$data = $data['data'];

		// save log file
		$file = 'log.txt';
		// Append a new person to the file
		$current = json_encode($data);
		// Write the contents back to the file
		file_put_contents($file, $current);


		$device_token = $data['device_token'];
		try {
			$phone_type = (int)$data['phone_type'];
		} catch (Exception $e) {	
			$phone_type = 0;
		}

        //session check
		// if( $this->session->userdata("session_id") != $session_id ){
		// 	$result = false;
		// }else{
			// get fields from db;
			$result = $this->token_model->insert_token($device_token, $phone_type);
	    // }

        //response
		$response = array("result_code" => true, "result_data" => array("result" => $result));
		// print response
		$this->output->set_content_type('application/json')->set_output(json_encode($response));
    }

    function send_notification() 
    {
    	// parsing request
        //$data = json_decode(file_get_contents('php://input'),true);
		$session_id = $_POST['session_id'];
		$from_userid = $_POST['from_userid'];
		$to_userid = $_POST['to_userid'];
		$message = $_POST['message'];
		
        //session check
		// if( $this->session->userdata("session_id") != $session_id ){
		// 	$result = false;
		// }else{
			// get fields from db;
			$result = $this->token_model->send_notification(new MongoId($from_userid),new MongoId($to_userid), $message);
	    // }

        //response
		$response = array("result_code" => true, "result_data" => array("result" => $result));
		// print response
		$this->output->set_content_type('application/json')->set_output(json_encode($response));
    }
    
}
