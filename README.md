```
conda env create -n beakerx_widgets -f configuration.yml
conda activate beakerx_widgets 
# install beakerx_base (cd $PATH_TO_BEAKERX_BASE; pip install -e .)
(cd beakerx_widgets; pip install -r requirements.txt --verbose)
beakerx install
```
