# beachrtc

## Testing Locally

In a terminal / command prompt, navigate to the `web` directory and type:

- In Python 2.7: `python -m SimpleHTTPServer 8000`
- In Python 3: `python -m http.server 8000`

Then navigate to `localhost:8000` in your browser. If you have admin rights, you can change the port to `80` and navigate to `localhost` in the browser.

## EC2 Server Instance

The following command will connect to the EC2 instance. Replace KEY_PATH with the path to your key file (absolute or relative).

`ssh -i KEY_PATH/beachrtc.pem ec2-user@ec2-52-38-106-219.us-west-2.compute.amazonaws.com`

AWS documentation: [Connecting to Your Linux Instance Using SSH](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstancesLinux.html)
