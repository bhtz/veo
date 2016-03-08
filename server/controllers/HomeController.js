// Import
import {Controller} from 'microscope-web';
import uuid from 'node-uuid';

class HomeController extends Controller {
	
	get routes(){
		return {
			'get /': 'index',
            'get /demo': 'demo',
			'get /try': 'tryIt'
		}
	}

	// index action
	// GET /
	index(request, response){
		response.render('home/index');
	}
    
    	// index action
	// GET /
	demo(request, response){
        response.locals.user = {username: 'anonymous'};
		response.render('home/demo');
	}
	
	tryIt(request, response){
		var id = uuid.v4();
		response.redirect('/demo/#/' + id);
	}
}

export default HomeController;