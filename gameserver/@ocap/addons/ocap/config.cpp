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
			class addMissionEventHandlers {};
			class callExtension {};
			class captureFrame {};
			class getClass {};
			class getRoundedDir {};
			class init {postInit = 1;};
			class log {};
			class logAvgCaptureTime {};
			class publish{};
			class removeEventHandlers {};
			class resetCapture{};

			class eh_deleted {};
			class eh_fired {};
			class eh_hitOrKilled {};
		};
	};
};