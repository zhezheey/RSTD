# ------------------------------------------
# Web Demo for RSTD (Traffic Sign Detection)
# Written by Wenzhe Wang
# ------------------------------------------

import time
import logging
import optparse
import tornado.wsgi
import tornado.httpserver
import urllib
import json
import shutil
import os
import cv2
import _init_paths
import numpy as np
import caffe
import socket
from fast_rcnn.config import cfg
from fast_rcnn.test import im_detect
from fast_rcnn.nms_wrapper import nms
from utils.timer import Timer
from flask import Flask, request, url_for, send_from_directory, render_template, jsonify
from werkzeug import secure_filename

# Default settings
REPO_DIRNAME = os.path.abspath(os.path.dirname(os.path.abspath(__file__)) + '/../..')
UPLOAD_FOLDER = os.path.abspath(os.path.dirname(os.path.abspath(__file__)) + '/../img')
SERVER_FOLDER = os.path.abspath(os.path.dirname(os.path.abspath(__file__)) + '/../server')
ALLOWED_IMAGE_EXTENSIONS = set(['png', 'bmp', 'jpg', 'jpe', 'jpeg', 'gif'])
CLASSES = ('__background__',
           'pl5', 'w57', 'p23', 'w55', 'pl100', 'ip', 'w59', 'w13', 'pl120', 'pl80',
           'p27', 'p26', 'io', 'ph5', 'ph4', 'pl20', 'il100', 'pl60', 'pl40', 'pg',
           'pm20', 'pn', 'po', 'pr40', 'il80', 'p3', 'wo', 'i2', 'i5', 'i4', 'p10', 
           'p11', 'p12', 'p19', 'pne', 'ph4.5', 'pl30', 'p6', 'p5', 'il60', 'pm55',
           'w32', 'pl50', 'pm30', 'pl70')
NETS = {'vgg16': ('VGG16', 'RSTD_3_branches_vgg16_scale2048.caffemodel')}

# Obtain the flask app object
app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def index():
    return upload_for_web(request)


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


def allowed_file(filename):
    return (
        '.' in filename and
        filename.rsplit('.', 1)[1] in ALLOWED_IMAGE_EXTENSIONS
    )


def upload_for_web(request):
    if request.method == 'POST':
        filepath = ''
        is_fake = 0
        
        # Upload files by local files
        if len(request.files) != 0:
            file = request.files['file']
            if file and allowed_file(file.filename):
                name = secure_filename(file.filename)
                filepath = os.path.join(UPLOAD_FOLDER, str(time.time()) + '_' + name)
                file.save(filepath)
                
        # Upload files by URLs or clicking demo pictures
        else:
            img_url = request.get_json()['url']
            is_fake = request.get_json()['fake']
            filename = img_url.split('/')[-1]
            if is_fake:
                filepath = os.path.join(SERVER_FOLDER, img_url)
            elif allowed_file(filename):  
                # TODO(wwz): more security checks on URLs
                socket.setdefaulttimeout(30)
                try:
                    filepath = os.path.join(UPLOAD_FOLDER, str(time.time()) + '_' + filename)
                    urllib.urlretrieve(img_url, filename=filepath)
                except socket.timeout:
                    count = 1
                    while count <= 5:
                        try:
                            urllib.urlretrieve(img_url, filename=filepath)                                              
                            break
                        except socket.timeout:
                            err_info = 'Reloading for %d time'%count if count == 1 else 'Reloading for %d times'%count
                            print(err_info)
                            count += 1
                    if count > 5:
                        print("Time out")
                        return jsonify(json.dumps({'state': 'error'}, indent=4, separators=(',', ': ')))
                except Exception as e:
                    print('Error: ', e)
                    return jsonify(json.dumps({'state': 'error'}, indent=4, separators=(',', ': ')))
                    
        if filepath == '':
            return jsonify(json.dumps({'state': 'error'}, indent=4, separators=(',', ': ')))

        im_name = filepath.split('/')[-1]

        print('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
        print('Detection for {}'.format(im_name))

        # Run the RSTD and return the result (type: json)
        result = app.clf.detection(app.clf.net, filepath)
        if is_fake:
            result['url'] = img_url
        else:    
            url_input = url_for('uploaded_file', filename=im_name)
            result['url'] = url_input

        result_json = json.dumps(result, indent=4, separators=(',', ': '))
        print('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
        print(result_json)

        return jsonify(result_json)
    return render_template("RSTD.html")


class RSTD(object):
    default_args = {
        'prototxt': os.path.join(cfg.MODELS_DIR, NETS['vgg16'][0],
                                 'faster_rcnn_end2end', 'RSTD_3_branches_test.prototxt'),
        'caffemodel': os.path.join(cfg.ROOT_DIR, 'output', NETS['vgg16'][1])
    }
    for key, val in default_args.iteritems():
        if not os.path.exists(val):
            raise Exception(
                "File for {} is missing. Should be at: {}".format(key, val))

    def __init__(self, prototxt, caffemodel, gpu_id):
        """Load the network and associated files."""
        
        cfg.TEST.HAS_RPN = True  # Use RPN for proposals

        logging.info('Loading net and associated files...')
        if gpu_id == -1:
            caffe.set_mode_cpu()
        else:
            caffe.set_mode_gpu()
            caffe.set_device(gpu_id)
            cfg.GPU_ID = gpu_id
        self.net = caffe.Net(prototxt, caffemodel, caffe.TEST)

        print('\n\nLoaded network {:s}'.format(caffemodel))

        # Warmup on a dummy image
        im = 128 * np.ones((300, 500, 3), dtype=np.uint8)
        for i in xrange(2):
            _, _ = im_detect(self.net, im)

    def detection(self, net, path):
        """Detect object classes in an image using pre-computed object proposals."""

        # Load the image
        im = cv2.imread(path)
        try:
            height, width, _ = im.shape
        except Exception as e:
            print('Error: ', e)
            return {'state': 'error'}

        # Detect all object classes and regress object bounds
        timer = Timer()
        timer.tic()
        scores, boxes = im_detect(net, im)
        timer.toc()
        print('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
        print(('Detection took {:.3f}s for {:d} object proposals').format(
               timer.total_time, boxes.shape[0]))

        # Get detection results for each class
        CONF_THRESH = 0.8
        NMS_THRESH = 0.3
        result_data = []
        for cls_ind, cls in enumerate(CLASSES[1:]):
            cls_ind += 1  # because we skipped background
            cls_boxes = boxes[:, 4 * cls_ind:4 * (cls_ind + 1)]
            cls_scores = scores[:, cls_ind]
            dets = np.hstack((cls_boxes, cls_scores[:, np.newaxis])).astype(np.float32)
            keep = nms(dets, NMS_THRESH)
            dets = dets[keep, :]
            result_data_part = self.get_results(cls, dets, thresh=CONF_THRESH)
            if len(result_data_part) != 0:
                result_data.append(result_data_part)
                
        # Return the final results
        result = {
            'time': timer.total_time,
            'width': width,
            'height': height,
            'result': result_data
        }
        return result

    def get_results(self, class_name, dets, thresh=0.5):
        """Get detection results for a class."""

        result_data_objects = []

        inds = np.where(dets[:, -1] >= thresh)[0]
        if len(inds) == 0:
            return {}

        for i in inds:
            bbox = dets[i, :4]
            score = dets[i, -1]

            result_bbox = {
                'xmin': int(bbox[0]),
                'ymin': int(bbox[1]),
                'xmax': int(bbox[2]),
                'ymax': int(bbox[3])
            }
            result_data_object = {
                'bbox': result_bbox,
                'score': float(score)
            }
            result_data_objects.append(result_data_object)

        result_data = {
            'category': class_name,
            'objects': result_data_objects
        }
        return result_data

def start_tornado(app, port=5000):
    http_server = tornado.httpserver.HTTPServer(
        tornado.wsgi.WSGIContainer(app))
    http_server.listen(port)
    print("Tornado server starting on port {}".format(port))
    tornado.ioloop.IOLoop.instance().start()


def start_from_terminal(app):
    """Parse command line options and start the server."""
    
    parser = optparse.OptionParser()
    parser.add_option(
        '-d', '--debug',
        help="enable debug mode",
        action="store_true", default=False)
    parser.add_option(
        '-p', '--port',
        help="which port to serve content on",
        type='int', default=5000)
    parser.add_option(
        '-g', '--gpu',
        help="choose gpu id",
        type='int', default=-1)

    opts, args = parser.parse_args()
    RSTD.default_args.update({'gpu_id': opts.gpu})

    # Initialize RSTD + warm start by forward for allocation
    app.clf = RSTD(**RSTD.default_args)
    app.clf.net.forward()

    if opts.debug:
        app.run(debug=True, host='0.0.0.0', port=opts.port)
    else:
        start_tornado(app, opts.port)


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    if os.path.exists(UPLOAD_FOLDER):
        shutil.rmtree(UPLOAD_FOLDER)
    os.makedirs(UPLOAD_FOLDER)
    start_from_terminal(app)
