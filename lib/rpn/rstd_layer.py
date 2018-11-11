# -------------------------------------------
# Regular and Small Target Feature Extraction Layer
# Written by Wenzhe Wang
# -------------------------------------------

import caffe
import copy
import math

DEBUG = False

class RSTDThreeBranchesLayer(caffe.Layer):
    """
    Expand object detection proposals by extracting the surrounding background 
    and internal key information. Outputs the original ROI, the ROI which focus 
    on the surrounding background information and the ROI which focus on the 
    internal key information.
    """
    
    def setup(self, bottom, top):
        # the original ROI
        top[0].reshape(1, 5)
        # the ROI which focus on the surrounding background information
        top[1].reshape(1, 5)
        # the ROI which focus on the internal key information
        top[2].reshape(1, 5)

    def forward(self, bottom, top):
        rois = bottom[1].data
        rois_b = copy.deepcopy(rois)
        rois_c = copy.deepcopy(rois)
        
        # TODO(wwz): Produce the best parameters w_b and w_c during training stage
        for i in range(rois.shape[0]):
            # w_b: 1.0
            rois_b[i][1] = max(0, 2 * rois[i][1]-rois[i][3])
            rois_b[i][3] = min(bottom[0].data[0][0], 2 * rois[i][3]-rois[i][1])
            rois_b[i][2] = max(0, 2 * rois[i][2]-rois[i][4])
            rois_b[i][4] = min(bottom[0].data[0][1], 2 * rois[i][4]-rois[i][2])
            
            # w_c: (2 - sqrt(2)) / 4
            rois_c[i][1] = rois[i][1] + (2 - math.sqrt(2)) / 4 * (rois[i][3]-rois[i][1])
            rois_c[i][3] = rois[i][3] - (2 - math.sqrt(2)) / 4 * (rois[i][3]-rois[i][1])
            rois_c[i][2] = rois[i][2] + (2 - math.sqrt(2)) / 4 * (rois[i][4]-rois[i][2])
            rois_c[i][4] = rois[i][4] - (2 - math.sqrt(2)) / 4 * (rois[i][4]-rois[i][2])
        
        if DEBUG:
            print('rois: {}'.format(rois[0]))
            print('rois_b: {}'.format(rois_b[0]))
            print('rois_c: {}'.format(rois_c[0]))
        
        # the original ROI
        top[0].reshape(*rois.shape)
        top[0].data[...] = rois
        
        # the ROI which focus on the surrounding background information
        top[1].reshape(*rois.shape)
        top[1].data[...] = rois_b
        
        # the ROI which focus on the internal key information
        top[2].reshape(*rois.shape)
        top[2].data[...] = rois_c

    def backward(self, top, propagate_down, bottom):
        """This layer does not propagate gradients."""    
        pass

    def reshape(self, bottom, top):
        """Reshaping happens during the call to forward."""
        pass


class RSTDTwoBranchesLayer(caffe.Layer):
    """
    Expand object detection proposals by extracting the surrounding background 
    information. Outputs the original ROI, the ROI which focus on the surrounding 
    background information.
    """
    
    def setup(self, bottom, top):
        # the original ROI
        top[0].reshape(1, 5)
        # the ROI which focus on the surrounding background information
        top[1].reshape(1, 5)

    def forward(self, bottom, top):
        rois = bottom[1].data
        rois_b = copy.deepcopy(rois)
        
        # TODO(wwz): Produce the best parameters w_b during training stage
        for i in range(rois.shape[0]):
            # w_b: 1.0
            rois_b[i][1] = max(0, 2 * rois[i][1]-rois[i][3])
            rois_b[i][3] = min(bottom[0].data[0][0], 2 * rois[i][3]-rois[i][1])
            rois_b[i][2] = max(0, 2 * rois[i][2]-rois[i][4])
            rois_b[i][4] = min(bottom[0].data[0][1], 2 * rois[i][4]-rois[i][2])
        
        if DEBUG:
            print('rois: {}'.format(rois[0]))
            print('rois_b: {}'.format(rois_b[0]))
        
        # the original ROI    
        top[0].reshape(*rois.shape)
        top[0].data[...] = rois
        
        # the ROI which focus on the surrounding background information
        top[1].reshape(*rois.shape)
        top[1].data[...] = rois_b
        
    def backward(self, top, propagate_down, bottom):
        """This layer does not propagate gradients."""    
        pass

    def reshape(self, bottom, top):
        """Reshaping happens during the call to forward."""
        pass
