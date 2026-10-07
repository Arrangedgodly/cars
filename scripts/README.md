# Scripts

A directory to contain python scripts for operations / utilities. 

## How to use

To ensure compatability with your local machine, it's recommended to create and use a .venv to run these scripts. 

I'm a big fan of using `uv` to manage my python installations and venvs. You can install it [here](https://docs.astral.sh/uv/getting-started/installation/#homebrew)

### Setup 

```shell

cd scripts

# Create the virtual environment
uv venv # If you get "No interpreter found" you can use `uv python install 3.12.0` and then re-run `uv venv`

# Install the python modules listed as dependencies in pyproject.toml
`uv sync` 

This will create your virtual environment and install the required python modules. 

You will also need to add a serviceAccountKey.json file which can be generated [here](https://console.firebase.google.com/u/0/project/cars-b0ceb/settings/serviceaccounts/adminsdk). 

### Run the scripts

To run the scripts you can either activate the virtual env and run the scripts within it. 
```
source .venv/bin/activate

python download_iamges.py
```

Or you can just run the scripts using uv outside of the venv 

`uv run python download_images.py`
 