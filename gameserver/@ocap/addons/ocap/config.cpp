class CfgPatches
{
	class OCAP
	{
		name = "OCAP";
		author = "MisterGoodson";
		requiredAddons[] = {"A3_Functions_F", "cba_main"};
		units[] = {};
		weapons[] = {};
	};
};

class CfgFunctions
{
	class OCAP
	{
		class null
		{
			file = "ocap\functions";
			class addEventHandlers {};
			class atEndOfArray {};
			class callExtension {};
			class prepEntitiesForTransit {};
			class exportData {};
			class init {postInit = 1;};
			class isKindOf {};
			class log {};
			class captureFrame {};

			class eh_fired {};
			class eh_hitOrKilled {};
		};
	};
};