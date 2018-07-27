# RSTD: Regular and Small Target Detection

### Introduction

[Caffe](http://caffe.berkeleyvision.org/) implementation of an approach of *Regular and Small Target Detection (RSTD)* based on [Faster R-CNN](https://github.com/rbgirshick/py-faster-rcnn) for the detection and recognition of regular and small targets such as traffic signs, created by Wenzhe Wang.

### Contents
1. [Requirements](#requirements)
2. [Installation (Basic)](#installation-basic)
3. [Demo](#demo)
4. [Installation (Training and Testing)](#installation-training-and-testing)
5. [Training and Testing](#training-and-testing)
6. [Citation](#citation)

### Requirements

1. GPU

	**Note:** If your GPU memory is not sufficient, try reducing the scales of images.

2. `Caffe` and `pycaffe` (see: [Caffe installation instructions](http://caffe.berkeleyvision.org/installation.html))

	**Note:** Caffe *must* be built with support for Python layers.
	```make
	# In your Makefile.config, make sure to have this line uncommented
	WITH_PYTHON_LAYER := 1
	```

### Installation (Basic)

1. Clone the RSTD repository into `$RSTD_ROOT`
	```Shell
	# Make sure to clone with --recursive
	git clone --recursive https://github.com/zhezheey/RSTD.git
	```

2. Build the Cython modules
	```Shell
	cd $RSTD_ROOT/lib
	make
	```

3. Build Caffe and pycaffe
	```Shell
	cd $RSTD_ROOT/caffe-fast-rcnn
	# Now follow the Caffe installation instructions here:
	#   http://caffe.berkeleyvision.org/installation.html
	# Modify Makefile.config according to your Caffe installation.
	make -j8 && make pycaffe
	```

4. Install python packages you might not have in `requirements.txt`
	```Shell
	# Some packages are not necessary if you don't run the web demo
	pip install -r requirements.txt
	```

### Demo

After completing basic installation, download [our pre-trained model on Tsinghua-Tencent 100K](https://drive.google.com/open?id=1ZIINGsHyV9m7KjjifgA1CpVXkN_JboAy) and place it inside the `$RSTD_ROOT/output` directory, then you'll be ready to run the demo below.

1. Run the python demo
	```Shell
	cd $RSTD_ROOT/tools
	python demo_RSTD.py
	```

2. Run the web demo, please see the `README.md` in `$RSTD_ROOT/web` for more details.
	```Shell
	cd $RSTD_ROOT/web/server
	# Python 2.7.9+ are needed to run the web demo
	python app.py -g [GPU_ID] -p [PORT]
	```

### Installation (Training and Testing)

1. Download the [Tsinghua-Tencent 100K](http://cg.cs.tsinghua.edu.cn/traffic-sign/) or [GTSDB](http://benchmark.ini.rub.de/?section=gtsdb&subsection=dataset) dataset and converts it into PASCAL VOC 2007's annotation format. For convenirnce, you can also download them from [here]() (Coming soon).

2. Create symlinks for the converted PASCAL VOC dataset
	```Shell
	cd $RSTD_ROOT/data
	ln -s $PASCAL_VOC_dataset VOCdevkit2007
	```

3. Download pre-trained ImageNet models
	```Shell
	cd $RSTD_ROOT
	./data/scripts/fetch_imagenet_models.sh
	```

### Training and Testing

To train and test RSTD models, use `experiments/scripts/RSTD_3_branches.sh` or  `experiments/scripts/RSTD_2_branches.sh`. Output is written underneath `$FRCN_ROOT/output`.

1. Train and test RSTD models:
	```Shell
	cd $RSTD_ROOT
	./experiments/scripts/RSTD_3_branches.sh [GPU_ID] VGG16 pascal_voc
	```

2. Trained RSTD models are saved under:
	```
	output/<experiment directory>/<dataset name>/
	```

3. Test outputs are saved under:
	```
	output/<experiment directory>/<dataset name>/<network snapshot name>/
	```

### Citation

Please link this project in your paper.
