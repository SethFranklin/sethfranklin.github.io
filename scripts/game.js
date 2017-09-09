
var CurrentTurn = 1;

var PieceValues = [0, 0, 0, 0, 0, 0, 0, 0, 0];

var GameOver = false;

function PressButton(ButtonIndex)
{

	if (PieceValues[ButtonIndex] == 0 && !GameOver)
	{

		var ButtonElement = document.getElementById("Button" + ButtonIndex);

		UpdateButtonStyle(ButtonElement);

		PieceValues[ButtonIndex] = CurrentTurn;

		CheckWinCondition();

		if (CurrentTurn == 2) CurrentTurn = 1;
		else CurrentTurn = 2;

	}

}

function UpdateButtonStyle(Element)
{

	if (CurrentTurn == 1) Element.style.backgroundImage = "url('./images/XPicture.svg')"; // Set X Image
	else Element.style.backgroundImage = "url('./images/OPicture.svg')"; // Set 0 Image

	Element.style.cursor = "initial";
	Element.style.animation = "piececlick 1s";
	Element.style.width = "80%";
	Element.style.height = "80%";
	Element.style.left = "10%";
	Element.style.top = "10%";

}

function CheckWinCondition()
{

	if
	(

		/* Horizontal */

		(PieceValues[0] == CurrentTurn && PieceValues[1] == CurrentTurn && PieceValues[2] == CurrentTurn) ||
		(PieceValues[3] == CurrentTurn && PieceValues[4] == CurrentTurn && PieceValues[5] == CurrentTurn) ||
		(PieceValues[6] == CurrentTurn && PieceValues[7] == CurrentTurn && PieceValues[8] == CurrentTurn) ||

		/* Vertical */

		(PieceValues[0] == CurrentTurn && PieceValues[3] == CurrentTurn && PieceValues[6] == CurrentTurn) ||
		(PieceValues[1] == CurrentTurn && PieceValues[4] == CurrentTurn && PieceValues[7] == CurrentTurn) ||
		(PieceValues[2] == CurrentTurn && PieceValues[5] == CurrentTurn && PieceValues[8] == CurrentTurn) ||

		/* Diagonal */

		(PieceValues[0] == CurrentTurn && PieceValues[4] == CurrentTurn && PieceValues[8] == CurrentTurn) ||
		(PieceValues[2] == CurrentTurn && PieceValues[4] == CurrentTurn && PieceValues[6] == CurrentTurn)

	)
	{

		GameOver = true;

		var GameBoardElement = document.getElementById("GameBoard");

		GameBoardElement.style.animation = "shadowinterpolate 1s";
		GameBoardElement.style.boxShadow = "0px 0px 30px gray";

		for (Index = 0; Index < PieceValues.length; Index++)
		{

			var ButtonElement = document.getElementById("Button" + Index);

			ButtonElement.style.cursor = "initial";

			if (PieceValues[Index] == CurrentTurn)
			{

				ButtonElement.parentElement.style.animation = "shadowinterpolate 1s";
				ButtonElement.parentElement.style.boxShadow = "0px 0px 30px gray";

			}

		}

	}
	else
	{

		var BoardFilled = true;

		for (Index = 0; Index < PieceValues.length; Index++)
		{

			if (PieceValues[Index] == 0) BoardFilled = false;

		}

		if (BoardFilled)
		{

			GameOver = true;

			var GameBoardElement = document.getElementById("GameBoard");

			GameBoardElement.style.animation = "shadowinterpolate 1s";
			GameBoardElement.style.boxShadow = "0px 0px 30px gray";

		}

	}

}