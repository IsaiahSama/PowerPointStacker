# Project Overview

PowerPoint Stacker (PP Stacker for short), is an Electron-based application designed to simplify the niche problem of having to present multiple Presentations consecutively, allowing users to preload and order the order they want the presentations to appear in, and have it seamlessly flow from one presentation to the next when the current one reaches the end.

The original problem is that users would either have to alt + tab, or search around for their next presentation, then share screen for example, for each presentation. However, this application will seek to provide just one service.

## Project Tools

This project will be built primarily using the Electron framework, using the Node runtime.

## Project Structure

The project should be structured according to Electron best practices, including having the functional code in the `main` folder, and the UI in the `renderer` folder.

## Project Development Phases

This project will be build by three (3) claude agents.

1. Spec Designer: An agent specialized of creating a specification document that outlines how the service will work, and interact between the frontend and backend.
1. UI Developer: An agent specialized in creating UI in the Electron framework, that will create the UI according to the specification document, and what functionalities the application will have, and the backend will provide.
1. Service Developer: An agent specialized in creating functional methods in the Electron Framework, that will create the methods, preload scripts, and other functionality needed for the application to run successfully, while adhering to the created specification document.


## Application Flow

1. On launching, users should be able to select a series of PPTX or ODP files.
1. Once loaded, users should be able to continue to add or remove them as they see fit.
1. Users should also be able to reorder the order in which they should show up.
1. When ready to present, users should press an intuitive button, that will full screen the presentation.
1. Users should be able to navigate between slides, by either clicking on left and right UI buttons provided by PP Stacker, or by using the left and right arrow keys. 
1. Once the user reaches the end of their current presentation, clicking "next" should load the next presentation.
1. There should be specific keybinds such as ctrl + pgup (to go to next presentation) and ctrl + pgdn (to go to previous presentation).
1. Once the user reaches the final slide of the final presentation, then the user will be presented with the option to return to the initial screen, or close the application.


## Special Considerations

This Electron application should be developed with Linux and Windows OS in mind particularly.
PP Stacker should also allow for passthrough, so users can interact directly with slides if needed.
Once all windows are closed, the app should quit.
